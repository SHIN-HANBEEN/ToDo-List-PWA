import { ensureSchema, getPool, normalizeLabelRow } from './_db.js'
import { parseBody, requireUser } from './_auth.js'

function parseLabelColor(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return null
  return trimmed.toLowerCase()
}

export default async function handler(req, res) {
  try {
    await ensureSchema()
    const pool = getPool()
    const user = await requireUser(req, res, pool)
    if (!user) return

    if (req.method === 'GET') {
      const result = await pool.query(
        `
          SELECT id, name, color, created_at
          FROM labels
          WHERE user_id = $1
          ORDER BY created_at DESC, id DESC;
        `,
        [user.id]
      )

      return res.status(200).json({ labels: result.rows.map(normalizeLabelRow) })
    }

    if (req.method === 'POST') {
      const body = parseBody(req)
      const name = String(body.name || '').trim().slice(0, 32)
      const color = parseLabelColor(body.color || '#64748b')

      if (!name) return res.status(400).json({ error: 'label name is required' })
      if (!color) return res.status(400).json({ error: 'label color must be a valid hex color' })

      const result = await pool.query(
        `
          INSERT INTO labels (user_id, name, color)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, name)
          DO UPDATE SET color = EXCLUDED.color
          RETURNING id, name, color, created_at;
        `,
        [user.id, name, color]
      )

      return res.status(201).json({ label: normalizeLabelRow(result.rows[0]) })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
