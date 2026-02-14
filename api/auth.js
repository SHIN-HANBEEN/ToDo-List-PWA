import { ensureSchema, getPool } from './_db.js'
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getUserFromRequest,
  hashPassword,
  parseBody,
  verifyPassword,
} from './_auth.js'

export default async function handler(req, res) {
  try {
    // 인증 요청 처리 전에 필요한 테이블 존재를 보장.
    await ensureSchema()
    const pool = getPool()

    if (req.method === 'GET') {
      // 클라이언트 초기 구동 시 현재 세션 사용자 확인.
      const user = await getUserFromRequest(req, pool)
      if (!user) return res.status(401).json({ error: 'Unauthorized' })
      return res.status(200).json({ user })
    }

    if (req.method === 'POST') {
      // 프런트 단순화를 위해 로그인/회원가입을 단일 엔드포인트에서 처리.
      const body = parseBody(req)
      const action = String(body.action || '')
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      const username = String(body.username || '').trim()

      if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
      if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' })

      if (action === 'signup') {
        if (!username) return res.status(400).json({ error: 'username is required' })
        if (username.length < 2 || username.length > 24) {
          return res.status(400).json({ error: 'username must be between 2 and 24 characters' })
        }

        // DB 유니크 제약이 있어도 UX를 위해 선검증.
        const exists = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1;', [email])
        if (exists.rows.length > 0) return res.status(409).json({ error: 'email already registered' })

        const created = await pool.query(
          'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username;',
          [email, username, hashPassword(password)]
        )

        const user = {
          id: Number(created.rows[0].id),
          email: created.rows[0].email,
          username: created.rows[0].username,
        }
        await createSession(req, res, pool, user.id)
        return res.status(201).json({ user })
      }

      if (action === 'login') {
        // 자격 증명 검증 후 세션 발급.
        const found = await pool.query(
          'SELECT id, email, username, password_hash FROM users WHERE email = $1 LIMIT 1;',
          [email]
        )
        if (found.rows.length === 0) return res.status(401).json({ error: 'invalid credentials' })

        const row = found.rows[0]
        if (!verifyPassword(password, row.password_hash)) {
          return res.status(401).json({ error: 'invalid credentials' })
        }

        const user = {
          id: Number(row.id),
          email: row.email,
          username: row.username,
        }
        await createSession(req, res, pool, user.id)
        return res.status(200).json({ user })
      }

      return res.status(400).json({ error: 'invalid action' })
    }

    if (req.method === 'DELETE') {
      // 로그아웃: DB 세션 삭제 + 브라우저 쿠키 제거.
      await deleteSession(req, pool)
      clearSessionCookie(req, res)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
