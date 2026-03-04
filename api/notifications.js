import { ensureSchema, getPool } from '../lib/server/db.js'
import { parseBody, requireUser } from '../lib/server/auth.js'
import { hasPushConfig, sendPushMessage } from '../lib/server/push.js'

const REMINDER_TYPE = 'due_30m'

function getSingleQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function getMode(req) {
  const mode = String(getSingleQueryValue(req.query?.mode) || '').trim().toLowerCase()
  return mode || 'subscriptions'
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function getSubscriptionPayload(body) {
  const subscription = body?.subscription || {}
  const endpoint = normalizeText(subscription.endpoint)
  const p256dh = normalizeText(subscription?.keys?.p256dh)
  const auth = normalizeText(subscription?.keys?.auth)
  const locale = normalizeText(body?.locale, 'en-US').slice(0, 24)
  const timezone = normalizeText(body?.timezone, 'UTC').slice(0, 80)
  const userAgent = normalizeText(body?.userAgent, '').slice(0, 260)
  return { endpoint, p256dh, auth, locale, timezone, userAgent }
}

function isAuthorizedCron(req) {
  const secret = String(process.env.CRON_SECRET || '').trim()
  if (!secret) return { ok: false, error: 'missing cron secret' }
  const auth = String(req.headers.authorization || '').trim()
  if (auth !== `Bearer ${secret}`) return { ok: false, error: 'forbidden' }
  return { ok: true }
}

function trimText(value, maxLength = 48) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}…`
}

function buildReminderMessage(todo, locale) {
  const lang = String(locale || 'en-US').toLowerCase()
  const taskName = trimText(todo.text)

  if (lang.startsWith('ko')) {
    return {
      title: 'Todogram 일정 알림',
      body: `${taskName} 일정이 30분 후 시작됩니다.`,
    }
  }

  return {
    title: 'Todogram Reminder',
    body: `${taskName} starts in 30 minutes.`,
  }
}

async function sendTodoReminder(pool, todo, subscriptions) {
  const inserted = await pool.query(
    `
      INSERT INTO todo_reminder_logs (todo_id, user_id, due_at, reminder_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (todo_id, reminder_type, due_at) DO NOTHING
      RETURNING id;
    `,
    [todo.id, todo.user_id, todo.due_at, REMINDER_TYPE]
  )

  if (inserted.rowCount === 0) {
    return { sent: 0, skipped: true, staleEndpoints: [] }
  }

  let sent = 0
  const staleEndpoints = []

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const message = buildReminderMessage(todo, subscription.locale)
      const payload = {
        title: message.title,
        body: message.body,
        tag: `todo-${todo.id}-${REMINDER_TYPE}`,
        data: {
          url: '/',
          todoId: Number(todo.id),
          dueAt: todo.due_at,
        },
      }

      try {
        await sendPushMessage(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        )
        sent += 1
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          staleEndpoints.push(subscription.endpoint)
        } else {
          console.error('push send failed', {
            todoId: todo.id,
            endpoint: subscription.endpoint,
            statusCode: error?.statusCode,
            body: error?.body,
          })
        }
      }
    })
  )

  return { sent, skipped: false, staleEndpoints }
}

async function handleReminderCron(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = isAuthorizedCron(req)
  if (!auth.ok) return res.status(403).json({ error: auth.error })
  if (!hasPushConfig()) return res.status(503).json({ error: 'web push is not configured on server' })

  await ensureSchema()
  const pool = getPool()

  const todoResult = await pool.query(
    `
      SELECT t.id, t.user_id, t.text, t.due_at
      FROM todos t
      WHERE t.done = FALSE
        AND t.due_at IS NOT NULL
        AND t.due_at BETWEEN NOW() + INTERVAL '25 minute' AND NOW() + INTERVAL '35 minute'
        AND EXISTS (
          SELECT 1
          FROM push_subscriptions ps
          WHERE ps.user_id = t.user_id
        )
      ORDER BY t.due_at ASC
      LIMIT 500;
    `
  )

  if (todoResult.rows.length === 0) {
    return res.status(200).json({ ok: true, scanned: 0, notified: 0, skipped: 0 })
  }

  const userIds = [...new Set(todoResult.rows.map((row) => Number(row.user_id)).filter((id) => Number.isFinite(id)))]
  const subscriptionResult = await pool.query(
    `
      SELECT id, user_id, endpoint, p256dh, auth, locale
      FROM push_subscriptions
      WHERE user_id = ANY($1::bigint[]);
    `,
    [userIds]
  )

  const subscriptionByUser = new Map()
  for (const row of subscriptionResult.rows) {
    const key = Number(row.user_id)
    if (!subscriptionByUser.has(key)) subscriptionByUser.set(key, [])
    subscriptionByUser.get(key).push(row)
  }

  let notified = 0
  let skipped = 0
  const staleEndpointSet = new Set()

  for (const todo of todoResult.rows) {
    const subs = subscriptionByUser.get(Number(todo.user_id)) || []
    if (subs.length === 0) {
      skipped += 1
      continue
    }

    const result = await sendTodoReminder(pool, todo, subs)
    notified += result.sent
    if (result.skipped) skipped += 1
    for (const endpoint of result.staleEndpoints) staleEndpointSet.add(endpoint)
  }

  if (staleEndpointSet.size > 0) {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[]);', [[...staleEndpointSet]])
  }

  return res.status(200).json({
    ok: true,
    scanned: todoResult.rows.length,
    notified,
    skipped,
    staleSubscriptionsRemoved: staleEndpointSet.size,
  })
}

async function handleSubscriptions(req, res) {
  await ensureSchema()
  const pool = getPool()
  const user = await requireUser(req, res, pool)
  if (!user) return

  if (req.method === 'GET') {
    return res.status(200).json({ configured: hasPushConfig() })
  }

  if (req.method === 'POST') {
    if (!hasPushConfig()) return res.status(503).json({ error: 'web push is not configured on server' })

    const body = parseBody(req)
    const { endpoint, p256dh, auth, locale, timezone, userAgent } = getSubscriptionPayload(body)
    if (!endpoint) return res.status(400).json({ error: 'subscription endpoint is required' })
    if (!p256dh || !auth) return res.status(400).json({ error: 'subscription keys are required' })

    await pool.query(
      `
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, locale, timezone, user_agent, last_seen_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (endpoint) DO UPDATE
        SET
          user_id = EXCLUDED.user_id,
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          locale = EXCLUDED.locale,
          timezone = EXCLUDED.timezone,
          user_agent = EXCLUDED.user_agent,
          last_seen_at = NOW();
      `,
      [user.id, endpoint, p256dh, auth, locale, timezone, userAgent]
    )

    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const body = parseBody(req)
    const endpoint = normalizeText(body?.endpoint)

    if (!endpoint) {
      const result = await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1;', [user.id])
      return res.status(200).json({ deletedCount: result.rowCount || 0 })
    }

    const result = await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2;',
      [user.id, endpoint]
    )
    return res.status(200).json({ deletedCount: result.rowCount || 0 })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default async function handler(req, res) {
  try {
    const mode = getMode(req)
    if (mode === 'reminders') return await handleReminderCron(req, res)
    return await handleSubscriptions(req, res)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
