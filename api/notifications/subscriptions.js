import { ensureSchema, getPool } from '../_db.js'
import { parseBody, requireUser } from '../_auth.js'
import { hasPushConfig } from '../_push.js'

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

export default async function handler(req, res) {
  try {
    await ensureSchema()
    const pool = getPool()
    const user = await requireUser(req, res, pool)
    if (!user) return

    if (req.method === 'GET') {
      return res.status(200).json({
        configured: hasPushConfig(),
      })
    }

    if (req.method === 'POST') {
      if (!hasPushConfig()) {
        return res.status(503).json({ error: 'web push is not configured on server' })
      }

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
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
