import { ensureSchema, getPool, normalizeTodoRow, normalizeCommentRow } from './_db.js'
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

    if (req.method === 'GET') {
      const todosResult = await pool.query(
        'SELECT id, text, done, position, created_at FROM todos WHERE user_id = $1 ORDER BY position ASC, created_at DESC;',
        [user.id]
      )
      const commentsResult = await pool.query(
        `
          SELECT c.id, c.todo_id, c.text, c.created_at
          FROM comments c
          JOIN todos t ON t.id = c.todo_id
          WHERE t.user_id = $1
          ORDER BY c.created_at DESC;
        `,
        [user.id]
      )

      const todos = todosResult.rows.map(normalizeTodoRow)
      const byId = new Map(todos.map((todo) => [todo.id, todo]))

      for (const row of commentsResult.rows) {
        const comment = normalizeCommentRow(row)
        const target = byId.get(comment.todoId)
        if (target) {
          target.comments.push({
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
          })
        }
      }

      return res.status(200).json({ todos })
    }

    if (req.method === 'POST') {
      const body = parseBody(req)
      const text = String(body.text || '').trim()
      if (!text) return res.status(400).json({ error: 'text is required' })

      const insertResult = await pool.query(
        `
          INSERT INTO todos (user_id, text, position)
          VALUES ($1, $2, COALESCE((SELECT MIN(position) FROM todos WHERE user_id = $1), 1) - 1)
          RETURNING id, text, done, position, created_at;
        `,
        [user.id, text]
      )

      return res.status(201).json({ todo: normalizeTodoRow(insertResult.rows[0]) })
    }

    if (req.method === 'PATCH') {
      const body = parseBody(req)

      if (Array.isArray(body.order)) {
        const order = body.order.map((item) => Number(item)).filter((item) => Number.isFinite(item))
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          for (let index = 0; index < order.length; index += 1) {
            await client.query('UPDATE todos SET position = $1 WHERE id = $2 AND user_id = $3;', [
              index + 1,
              order[index],
              user.id,
            ])
          }
          await client.query('COMMIT')
          return res.status(200).json({ ok: true })
        } catch (error) {
          await client.query('ROLLBACK')
          throw error
        } finally {
          client.release()
        }
      }

      const id = Number(body.id)
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'id is required' })

      const updates = []
      const values = []
      let valueIndex = 1

      if (typeof body.done === 'boolean') {
        updates.push(`done = $${valueIndex}`)
        values.push(body.done)
        valueIndex += 1
      }

      if (typeof body.text === 'string') {
        const text = body.text.trim()
        if (!text) return res.status(400).json({ error: 'text must not be empty' })
        updates.push(`text = $${valueIndex}`)
        values.push(text)
        valueIndex += 1
      }

      if (updates.length === 0) return res.status(400).json({ error: 'no valid fields to update' })

      values.push(id, user.id)
      const result = await pool.query(
        `UPDATE todos SET ${updates.join(', ')} WHERE id = $${valueIndex} AND user_id = $${
          valueIndex + 1
        } RETURNING id, text, done, position, created_at;`,
        values
      )

      if (result.rows.length === 0) return res.status(404).json({ error: 'todo not found' })

      return res.status(200).json({ todo: normalizeTodoRow(result.rows[0]) })
    }

    if (req.method === 'DELETE') {
      const doneOnly = getSingleQueryValue(req.query.done) === 'true'

      if (doneOnly) {
        const result = await pool.query('DELETE FROM todos WHERE done = TRUE AND user_id = $1;', [user.id])
        return res.status(200).json({ deletedCount: result.rowCount || 0 })
      }

      const id = Number(getSingleQueryValue(req.query.id))
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'id query is required' })

      const result = await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id;', [
        id,
        user.id,
      ])
      if (result.rows.length === 0) return res.status(404).json({ error: 'todo not found' })

      return res.status(200).json({ deletedId: Number(result.rows[0].id) })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
