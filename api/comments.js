import { ensureSchema, getPool, normalizeCommentRow } from './_db.js'
import { parseBody, requireUser } from './_auth.js'

function getSingleQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(req, res) {
  try {
    await ensureSchema()
    const pool = getPool()
    const user = await requireUser(req, res, pool)
    if (!user) return

    if (req.method === 'POST') {
      const body = parseBody(req)
      const todoId = Number(body.todoId)
      const text = String(body.text || '').trim()

      if (!Number.isFinite(todoId)) return res.status(400).json({ error: 'todoId is required' })
      if (!text) return res.status(400).json({ error: 'text is required' })

      const result = await pool.query(
        `
          INSERT INTO comments (todo_id, text)
          SELECT t.id, $2
          FROM todos t
          WHERE t.id = $1 AND t.user_id = $3
          RETURNING id, todo_id, text, created_at;
        `,
        [todoId, text, user.id]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: 'todo not found' })

      const comment = normalizeCommentRow(result.rows[0])
      return res.status(201).json({
        comment: {
          id: comment.id,
          todoId: comment.todoId,
          text: comment.text,
          createdAt: comment.createdAt,
        },
      })
    }

    if (req.method === 'DELETE') {
      const id = Number(getSingleQueryValue(req.query.id))
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'id query is required' })

      const result = await pool.query(
        `
          DELETE FROM comments c
          USING todos t
          WHERE c.id = $1
            AND c.todo_id = t.id
            AND t.user_id = $2
          RETURNING c.id;
        `,
        [id, user.id]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: 'comment not found' })

      return res.status(200).json({ deletedId: Number(result.rows[0].id) })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
