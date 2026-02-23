import { ensureSchema, getPool, normalizeImprovementRequestRow } from './_db.js'
import { parseBody, requireUser } from './_auth.js'

const ADMIN_EMAIL = 'shb080101@gmail.com'

function isAdminUser(user) {
  return String(user?.email || '').trim().toLowerCase() === ADMIN_EMAIL
}

function getSingleQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function parseTitle(value) {
  return String(value || '')
    .trim()
    .slice(0, 120)
}

function parseContent(value) {
  return String(value || '')
    .trim()
    .slice(0, 4000)
}

export default async function handler(req, res) {
  try {
    await ensureSchema()
    const pool = getPool()
    const user = await requireUser(req, res, pool)
    if (!user) return

    if (req.method === 'POST') {
      const body = parseBody(req)
      const title = parseTitle(body.title)
      const content = parseContent(body.content)

      if (!title) return res.status(400).json({ error: 'title is required' })
      if (!content) return res.status(400).json({ error: 'text is required' })

      const result = await pool.query(
        `
          INSERT INTO improvement_requests (user_id, title, content)
          VALUES ($1, $2, $3)
          RETURNING id, user_id, title, content, created_at;
        `,
        [user.id, title, content]
      )
      return res.status(201).json({ improvement: normalizeImprovementRequestRow(result.rows[0]) })
    }

    if (req.method === 'GET') {
      if (!isAdminUser(user)) return res.status(403).json({ error: 'Forbidden' })

      const result = await pool.query(
        `
          SELECT
            ir.id,
            ir.user_id,
            ir.title,
            ir.content,
            ir.created_at,
            u.email AS reporter_email,
            u.username AS reporter_username
          FROM improvement_requests ir
          JOIN users u ON u.id = ir.user_id
          ORDER BY ir.created_at DESC;
        `
      )
      return res.status(200).json({ improvements: result.rows.map(normalizeImprovementRequestRow) })
    }

    if (req.method === 'DELETE') {
      if (!isAdminUser(user)) return res.status(403).json({ error: 'Forbidden' })
      const id = Number(getSingleQueryValue(req.query.id))
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'id query is required' })

      const result = await pool.query('DELETE FROM improvement_requests WHERE id = $1 RETURNING id;', [id])
      if (result.rows.length === 0) return res.status(404).json({ error: 'improvement request not found' })

      return res.status(200).json({ deletedId: Number(result.rows[0].id) })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
