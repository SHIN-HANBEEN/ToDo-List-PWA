import { ensureSchema, getPool } from '../_db.js'
import { hasPushConfig, sendPushMessage } from '../_push.js'

const REMINDER_TYPE = 'due_30m'

function isAuthorizedCron(req) {
  const secret = String(process.env.CRON_SECRET || '').trim()
  if (!secret) {
    return { ok: false, error: 'missing cron secret' }
  }
  const auth = String(req.headers.authorization || '').trim()
  if (auth !== `Bearer ${secret}`) {
    return { ok: false, error: 'forbidden' }
  }
  return { ok: true }
}

function trimText(value, maxLength = 48) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}…`
}

function buildMessage(todo, locale) {
  const lang = String(locale || 'en-US').toLowerCase()
  const taskName = trimText(todo.text)

  if (lang.startsWith('ko')) {
    return {
      title: 'Todogram 일정 알림',
      body: `${taskName} 일정이 30분 후 시작됩니다.`,
    }
  }
  if (lang.startsWith('ja')) {
    return {
      title: 'Todogram Reminder',
      body: `${taskName} starts in 30 minutes.`,
    }
  }
  if (lang.startsWith('zh')) {
    return {
      title: 'Todogram 提醒',
      body: `${taskName} 将在 30 分钟后开始。`,
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
      const message = buildMessage(todo, subscription.locale)
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

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

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
      await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[]);', [
        [...staleEndpointSet],
      ])
    }

    return res.status(200).json({
      ok: true,
      scanned: todoResult.rows.length,
      notified,
      skipped,
      staleSubscriptionsRemoved: staleEndpointSet.size,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
