import { ensureSchema, getPool, normalizeTodoRow, normalizeCommentRow } from './_db.js'
import { parseBody, requireUser } from './_auth.js'

function getSingleQueryValue(value) {
  // Vercel에서 쿼리 값이 string 또는 string[]로 올 수 있어 단일 값으로 정규화.
  return Array.isArray(value) ? value[0] : value
}

function parseDueAt(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function parseLabelColor(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return null
  return trimmed.toLowerCase()
}

const TODO_STATUSES = new Set(['waiting', 'active', 'done'])

function parseTodoStatus(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!TODO_STATUSES.has(normalized)) return null
  return normalized
}

function statusToDone(status) {
  return status === 'done'
}

export default async function handler(req, res) {
  try {
    await ensureSchema()
    const pool = getPool()
    // 모든 TODO 작업은 로그인 사용자 기준으로 제한.
    const user = await requireUser(req, res, pool)
    if (!user) return

    if (req.method === 'GET') {
      // 자동 이월 옵션이 켜진 미완료 TODO는 마감일이 지났으면 다음날(필요 일수만큼)로 이동.
      await pool.query(
        `
          UPDATE todos
          SET due_at = due_at + (((FLOOR(EXTRACT(EPOCH FROM (NOW() - due_at)) / 86400) + 1)::INT) * INTERVAL '1 day')
          WHERE user_id = $1
            AND done = FALSE
            AND rollover_enabled = TRUE
            AND due_at IS NOT NULL
            AND due_at < NOW();
        `,
        [user.id]
      )

      // todo/comment를 분리 조회 후 메모리에서 중첩 구조로 조합.
      const todosResult = await pool.query(
        `
          SELECT id, text, status, done, due_at, location, label_text, label_color, rollover_enabled, position, created_at
          FROM todos
          WHERE user_id = $1
          ORDER BY position ASC, created_at DESC;
        `,
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
      // 새 TODO는 최소 position으로 넣어 목록 상단에 보이게 처리.
      const body = parseBody(req)
      const text = String(body.text || '').trim()
      const dueAt = parseDueAt(body.dueAt)
      const location = String(body.location || '').trim().slice(0, 160)
      const labelText = String(body.labelText || '').trim().slice(0, 32)
      const parsedLabelColor = parseLabelColor(body.labelColor || '#64748b')
      const labelColor = labelText ? parsedLabelColor : '#64748b'
      const rolloverEnabled = Boolean(body.rolloverEnabled)
      const hasStatus = Object.prototype.hasOwnProperty.call(body, 'status')
      const status = hasStatus ? parseTodoStatus(body.status) : 'active'
      if (!text) return res.status(400).json({ error: 'text is required' })
      if (body.dueAt && !dueAt) return res.status(400).json({ error: 'dueAt must be a valid datetime' })
      if (!labelColor) return res.status(400).json({ error: 'labelColor must be a valid hex color' })
      if (!status) return res.status(400).json({ error: 'status must be one of waiting, active, done' })

      const insertResult = await pool.query(
        `
          INSERT INTO todos (user_id, text, status, done, due_at, location, label_text, label_color, rollover_enabled, position)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE((SELECT MIN(position) FROM todos WHERE user_id = $1), 1) - 1)
          RETURNING id, text, status, done, due_at, location, label_text, label_color, rollover_enabled, position, created_at;
        `,
        [user.id, text, status, statusToDone(status), dueAt, location, labelText, labelColor, rolloverEnabled]
      )

      return res.status(201).json({ todo: normalizeTodoRow(insertResult.rows[0]) })
    }

    if (req.method === 'PATCH') {
      const body = parseBody(req)

      if (Array.isArray(body.order)) {
        // 드래그 정렬 순서를 position으로 영속화.
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

      // PATCH 의미에 맞춘 부분 업데이트 처리.
      const updates = []
      const values = []
      let valueIndex = 1

      const parsedStatus = parseTodoStatus(body.status)
      const hasStatus = typeof body.status === 'string'
      if (hasStatus && !parsedStatus) {
        return res.status(400).json({ error: 'status must be one of waiting, active, done' })
      }

      if (hasStatus) {
        updates.push(`status = $${valueIndex}`)
        values.push(parsedStatus)
        valueIndex += 1
        updates.push(`done = $${valueIndex}`)
        values.push(statusToDone(parsedStatus))
        valueIndex += 1
      } else if (typeof body.done === 'boolean') {
        updates.push(`done = $${valueIndex}`)
        values.push(body.done)
        valueIndex += 1
        updates.push(`status = $${valueIndex}`)
        values.push(body.done ? 'done' : 'active')
        valueIndex += 1
      }

      if (typeof body.text === 'string') {
        const text = body.text.trim()
        if (!text) return res.status(400).json({ error: 'text must not be empty' })
        updates.push(`text = $${valueIndex}`)
        values.push(text)
        valueIndex += 1
      }

      if (Object.prototype.hasOwnProperty.call(body, 'dueAt')) {
        const dueAt = parseDueAt(body.dueAt)
        if (body.dueAt && !dueAt) return res.status(400).json({ error: 'dueAt must be a valid datetime' })
        updates.push(`due_at = $${valueIndex}`)
        values.push(dueAt)
        valueIndex += 1
      }

      if (typeof body.location === 'string') {
        updates.push(`location = $${valueIndex}`)
        values.push(body.location.trim().slice(0, 160))
        valueIndex += 1
      }

      if (typeof body.labelText === 'string') {
        updates.push(`label_text = $${valueIndex}`)
        values.push(body.labelText.trim().slice(0, 32))
        valueIndex += 1
      }

      if (typeof body.labelColor === 'string') {
        const labelColor = parseLabelColor(body.labelColor)
        if (!labelColor) return res.status(400).json({ error: 'labelColor must be a valid hex color' })
        updates.push(`label_color = $${valueIndex}`)
        values.push(labelColor)
        valueIndex += 1
      }

      if (typeof body.rolloverEnabled === 'boolean') {
        updates.push(`rollover_enabled = $${valueIndex}`)
        values.push(body.rolloverEnabled)
        valueIndex += 1
      }

      if (updates.length === 0) return res.status(400).json({ error: 'no valid fields to update' })

      values.push(id, user.id)
      const result = await pool.query(
        `UPDATE todos SET ${updates.join(', ')} WHERE id = $${valueIndex} AND user_id = $${
          valueIndex + 1
        } RETURNING id, text, status, done, due_at, location, label_text, label_color, rollover_enabled, position, created_at;`,
        values
      )

      if (result.rows.length === 0) return res.status(404).json({ error: 'todo not found' })

      return res.status(200).json({ todo: normalizeTodoRow(result.rows[0]) })
    }

    if (req.method === 'DELETE') {
      // 단건 삭제와 완료 항목 일괄 삭제를 모두 지원.
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
