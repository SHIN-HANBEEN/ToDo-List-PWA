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

    if (req.method === 'PATCH') {
      const body = parseBody(req)
      const id = Number(body.id)
      const name = String(body.name || '').trim().slice(0, 32)
      const color = parseLabelColor(body.color || '#64748b')

      if (!Number.isFinite(id)) return res.status(400).json({ error: 'id is required' })
      if (!name) return res.status(400).json({ error: 'label name is required' })
      if (!color) return res.status(400).json({ error: 'label color must be a valid hex color' })

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const previousResult = await client.query(
          `
            SELECT id, name, color
            FROM labels
            WHERE id = $1 AND user_id = $2
            FOR UPDATE;
          `,
          [id, user.id]
        )
        if (previousResult.rows.length === 0) {
          await client.query('ROLLBACK')
          return res.status(404).json({ error: 'label not found' })
        }

        const previous = previousResult.rows[0]
        const updateResult = await client.query(
          `
            UPDATE labels
            SET name = $1, color = $2
            WHERE id = $3 AND user_id = $4
            RETURNING id, name, color, created_at;
          `,
          [name, color, id, user.id]
        )

        await client.query(
          `
            UPDATE todos
            SET label_text = $1, label_color = $2
            WHERE user_id = $3
              AND label_text = $4;
          `,
          [name, color, user.id, previous.name]
        )

        await client.query('COMMIT')
        return res.status(200).json({
          label: normalizeLabelRow(updateResult.rows[0]),
          previousName: previous.name,
        })
      } catch (error) {
        await client.query('ROLLBACK')
        if (error?.code === '23505') {
          return res.status(409).json({ error: 'label name already exists' })
        }
        throw error
      } finally {
        client.release()
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
