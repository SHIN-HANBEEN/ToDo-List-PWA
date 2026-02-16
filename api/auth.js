import { ensureSchema, getPool } from './_db.js'
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getUserFromRequest,
  hashPassword,
  parseBody,
  requireUser,
  verifyPassword,
} from './_auth.js'

function normalizeUsername(value) {
  return String(value || '').trim()
}

function parseAvatarUrl(body) {
  if (!Object.prototype.hasOwnProperty.call(body, 'avatarUrl')) {
    return { provided: false, value: '' }
  }

  if (typeof body.avatarUrl !== 'string') {
    return { provided: true, error: 'avatarUrl must be a valid image url' }
  }

  const trimmed = body.avatarUrl.trim()
  if (!trimmed) return { provided: true, value: '' }
  if (trimmed.length > 2_000_000) return { provided: true, error: 'avatar image is too large' }
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(trimmed)) return { provided: true, value: trimmed }
  if (/^https?:\/\//i.test(trimmed)) return { provided: true, value: trimmed.slice(0, 2000) }
  return { provided: true, error: 'avatarUrl must be a valid image url' }
}

function toUserPayload(row) {
  return {
    id: Number(row.id),
    email: row.email,
    username: row.username,
    avatarUrl: row.avatar_url || '',
  }
}

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
      const username = normalizeUsername(body.username)

      if (action === 'check-username') {
        if (!username) return res.status(400).json({ error: 'username is required' })
        if (username.length < 2 || username.length > 24) {
          return res.status(400).json({ error: 'username must be between 2 and 24 characters' })
        }

        const currentUser = await getUserFromRequest(req, pool)
        const exists = await pool.query('SELECT id FROM users WHERE lower(username) = lower($1) LIMIT 1;', [username])
        const available =
          exists.rows.length === 0 ||
          (currentUser && Number(exists.rows[0].id) === Number(currentUser.id))
        return res.status(200).json({ available })
      }

      if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
      if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' })

      if (action === 'signup') {
        if (!username) return res.status(400).json({ error: 'username is required' })
        if (username.length < 2 || username.length > 24) {
          return res.status(400).json({ error: 'username must be between 2 and 24 characters' })
        }

        const client = await pool.connect()
        let userRow = null
        try {
          await client.query('BEGIN')
          await client.query('SELECT pg_advisory_xact_lock(hashtext($1));', [username.toLowerCase()])

          const existsByEmail = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1;', [email])
          if (existsByEmail.rows.length > 0) {
            await client.query('ROLLBACK')
            return res.status(409).json({ error: 'email already registered' })
          }

          const existsByUsername = await client.query(
            'SELECT id FROM users WHERE lower(username) = lower($1) LIMIT 1;',
            [username]
          )
          if (existsByUsername.rows.length > 0) {
            await client.query('ROLLBACK')
            return res.status(409).json({ error: 'username already exists' })
          }

          const created = await client.query(
            'INSERT INTO users (email, username, password_hash, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, email, username, avatar_url;',
            [email, username, hashPassword(password), '']
          )
          userRow = created.rows[0]
          await client.query('COMMIT')
        } catch (error) {
          await client.query('ROLLBACK')
          throw error
        } finally {
          client.release()
        }

        const user = toUserPayload(userRow)
        await createSession(req, res, pool, user.id)
        return res.status(201).json({ user })
      }

      if (action === 'login') {
        const found = await pool.query(
          'SELECT id, email, username, avatar_url, password_hash FROM users WHERE email = $1 LIMIT 1;',
          [email]
        )
        if (found.rows.length === 0) return res.status(401).json({ error: 'invalid credentials' })

        const row = found.rows[0]
        if (!verifyPassword(password, row.password_hash)) {
          return res.status(401).json({ error: 'invalid credentials' })
        }

        const user = toUserPayload(row)
        await createSession(req, res, pool, user.id)
        return res.status(200).json({ user })
      }

      return res.status(400).json({ error: 'invalid action' })
    }

    if (req.method === 'PATCH') {
      const authUser = await requireUser(req, res, pool)
      if (!authUser) return

      const body = parseBody(req)
      const username = normalizeUsername(body.username)
      const hasUsername = Object.prototype.hasOwnProperty.call(body, 'username')
      const avatarResult = parseAvatarUrl(body)
      if (avatarResult.error) return res.status(400).json({ error: avatarResult.error })

      if (hasUsername) {
        if (!username) return res.status(400).json({ error: 'username is required' })
        if (username.length < 2 || username.length > 24) {
          return res.status(400).json({ error: 'username must be between 2 and 24 characters' })
        }
      }

      const updates = []
      const values = []
      let index = 1

      if (hasUsername) {
        updates.push(`username = $${index}`)
        values.push(username)
        index += 1
      }
      if (avatarResult.provided) {
        updates.push(`avatar_url = $${index}`)
        values.push(avatarResult.value)
        index += 1
      }
      if (updates.length === 0) return res.status(400).json({ error: 'no valid fields to update' })

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        if (hasUsername) {
          await client.query('SELECT pg_advisory_xact_lock(hashtext($1));', [username.toLowerCase()])
          const duplicated = await client.query(
            'SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2 LIMIT 1;',
            [username, authUser.id]
          )
          if (duplicated.rows.length > 0) {
            await client.query('ROLLBACK')
            return res.status(409).json({ error: 'username already exists' })
          }
        }

        values.push(authUser.id)
        const result = await client.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${index} RETURNING id, email, username, avatar_url;`,
          values
        )
        await client.query('COMMIT')
        return res.status(200).json({ user: toUserPayload(result.rows[0]) })
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
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
