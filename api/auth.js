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
    await ensureSchema()
    const pool = getPool()

    if (req.method === 'GET') {
      const user = await getUserFromRequest(req, pool)
      if (!user) return res.status(401).json({ error: 'Unauthorized' })
      return res.status(200).json({ user })
    }

    if (req.method === 'POST') {
      const body = parseBody(req)
      const action = String(body.action || '')
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')

      if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
      if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' })

      if (action === 'signup') {
        const exists = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1;', [email])
        if (exists.rows.length > 0) return res.status(409).json({ error: 'email already registered' })

        const created = await pool.query(
          'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email;',
          [email, hashPassword(password)]
        )

        const user = {
          id: Number(created.rows[0].id),
          email: created.rows[0].email,
        }
        await createSession(req, res, pool, user.id)
        return res.status(201).json({ user })
      }

      if (action === 'login') {
        const found = await pool.query(
          'SELECT id, email, password_hash FROM users WHERE email = $1 LIMIT 1;',
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
        }
        await createSession(req, res, pool, user.id)
        return res.status(200).json({ user })
      }

      return res.status(400).json({ error: 'invalid action' })
    }

    if (req.method === 'DELETE') {
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
