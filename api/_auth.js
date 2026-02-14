import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Cookie-based session auth (similar to Spring Session concept, but lightweight).
const SESSION_COOKIE = 'todo_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

function hashSha256(value) {
  // Store only hash in DB so raw tokens are never persisted.
  return createHash('sha256').update(value).digest('hex')
}

function parseCookies(req) {
  const header = req.headers.cookie || ''
  if (!header) return {}
  return header.split(';').reduce((acc, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split('=')
    if (!rawKey) return acc
    acc[rawKey] = decodeURIComponent(rawValue.join('=') || '')
    return acc
  }, {})
}

export function parseBody(req) {
  // Vercel functions may receive string or object body depending on runtime path.
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

export function hashPassword(password) {
  // Salted scrypt hash; output format: salt:hash
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password, storedHash) {
  // Constant-time compare to reduce timing side-channel risk.
  if (!storedHash || !storedHash.includes(':')) return false
  const [salt, original] = storedHash.split(':')
  const derived = scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(original, 'hex')
  const b = Buffer.from(derived, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function isSecureCookie(req) {
  // Keep local dev usable on http while enforcing Secure in production/https.
  return req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'
}

export function clearSessionCookie(req, res) {
  const secure = isSecureCookie(req) ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  )
}

export async function createSession(req, res, pool, userId) {
  // Generate opaque session token and store only its hash server-side.
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashSha256(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await pool.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3);',
    [userId, tokenHash, expiresAt]
  )

  const secure = isSecureCookie(req) ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
      SESSION_TTL_MS / 1000
    }${secure}`
  )
}

export async function deleteSession(req, pool) {
  const cookies = parseCookies(req)
  const token = cookies[SESSION_COOKIE]
  if (!token) return
  await pool.query('DELETE FROM sessions WHERE token_hash = $1;', [hashSha256(token)])
}

export async function getUserFromRequest(req, pool) {
  // Read cookie -> hash lookup -> join user. Expired sessions are ignored.
  const cookies = parseCookies(req)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null

  const tokenHash = hashSha256(token)
  const result = await pool.query(
    `
      SELECT u.id, u.email
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
      LIMIT 1;
    `,
    [tokenHash]
  )

  if (result.rows.length === 0) return null
  return {
    id: Number(result.rows[0].id),
    email: result.rows[0].email,
  }
}

export async function requireUser(req, res, pool) {
  // Guard helper for protected API routes.
  const user = await getUserFromRequest(req, pool)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return user
}
