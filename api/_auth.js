import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// 쿠키 기반 세션 인증(개념은 Spring Session과 유사, 구현은 경량).
const SESSION_COOKIE = 'todo_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

function hashSha256(value) {
  // 원본 토큰은 저장하지 않고 해시만 DB에 보관.
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
  // Vercel 런타임 경로에 따라 body가 문자열/객체로 올 수 있어 모두 처리.
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
  // scrypt + salt 해시. 저장 포맷: salt:hash
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password, storedHash) {
  // 타이밍 공격 완화를 위해 상수 시간 비교 사용.
  if (!storedHash || !storedHash.includes(':')) return false
  const [salt, original] = storedHash.split(':')
  const derived = scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(original, 'hex')
  const b = Buffer.from(derived, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function isSecureCookie(req) {
  // 로컬(http)은 개발 편의 유지, 운영/https는 Secure 쿠키 강제.
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
  // 불투명 세션 토큰을 발급하고 서버에는 해시만 저장.
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
  // 쿠키 읽기 -> 토큰 해시 조회 -> 사용자 조인. 만료 세션은 제외.
  const cookies = parseCookies(req)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null

  const tokenHash = hashSha256(token)
  const result = await pool.query(
    `
      SELECT u.id, u.email, u.username
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
    username: result.rows[0].username,
  }
}

export async function requireUser(req, res, pool) {
  // 보호된 API 라우트에서 공통으로 쓰는 인증 가드.
  const user = await getUserFromRequest(req, pool)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return user
}
