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

function parseLabelTexts(value) {
  if (!Array.isArray(value)) return []
  const parsed = []
  for (const item of value) {
    const next = String(item || '').trim().slice(0, 32)
    if (next) parsed.push(next)
    if (parsed.length >= 50) break
  }
  return parsed
}

function parseLabelColors(value, labelCount, fallbackColor = '#64748b') {
  if (labelCount <= 0) return []
  const parsed = Array.isArray(value)
    ? value.map((item) => parseLabelColor(item)).filter((item) => Boolean(item))
    : []
  return Array.from({ length: labelCount }, (_, index) => parsed[index] || fallbackColor)
}

function parseTodoTitle(value) {
  return String(value || '')
    .trim()
    .slice(0, 120)
}

function parseTodoContent(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .trim()
    .slice(0, 4000)
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
          SELECT id, title, content, text, status, done, due_at, location, label_text, label_color, label_texts, label_colors, rollover_enabled, position, created_at
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
      const titleSource = Object.prototype.hasOwnProperty.call(body, 'title') ? body.title : body.text
      const title = parseTodoTitle(titleSource)
      const content = parseTodoContent(body.content)
      const dueAt = parseDueAt(body.dueAt)
      const location = String(body.location || '').trim().slice(0, 160)
      let labelTexts = parseLabelTexts(body.labelTexts)
      if (labelTexts.length === 0) {
        const singleLabelText = String(body.labelText || '').trim().slice(0, 32)
        labelTexts = singleLabelText ? [singleLabelText] : []
      }
      const parsedLabelColor = parseLabelColor(body.labelColor || '#64748b')
      const labelColors = parseLabelColors(body.labelColors, labelTexts.length, parsedLabelColor || '#64748b')
      const labelText = labelTexts[0] || ''
      const labelColor = labelText ? labelColors[0] || parsedLabelColor : '#64748b'
      const rolloverEnabled = Boolean(body.rolloverEnabled)
      const hasStatus = Object.prototype.hasOwnProperty.call(body, 'status')
      const status = hasStatus ? parseTodoStatus(body.status) : 'waiting'
      if (!title) return res.status(400).json({ error: 'title is required' })
      if (body.dueAt && !dueAt) return res.status(400).json({ error: 'dueAt must be a valid datetime' })
      if (!labelColor) return res.status(400).json({ error: 'labelColor must be a valid hex color' })
      if (!status) return res.status(400).json({ error: 'status must be one of waiting, active, done' })

      const insertResult = await pool.query(
        `
          INSERT INTO todos (user_id, title, content, text, status, done, due_at, location, label_text, label_color, label_texts, label_colors, rollover_enabled, position)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, COALESCE((SELECT MIN(position) FROM todos WHERE user_id = $1), 1) - 1)
          RETURNING id, title, content, text, status, done, due_at, location, label_text, label_color, label_texts, label_colors, rollover_enabled, position, created_at;
        `,
        [
          user.id,
          title,
          content,
          title,
          status,
          statusToDone(status),
          dueAt,
          location,
          labelText,
          labelColor,
          JSON.stringify(labelTexts),
          JSON.stringify(labelColors),
          rolloverEnabled,
        ]
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

      if (typeof body.title === 'string') {
        const title = parseTodoTitle(body.title)
        if (!title) return res.status(400).json({ error: 'title must not be empty' })
        updates.push(`title = $${valueIndex}`)
        values.push(title)
        valueIndex += 1
        updates.push(`text = $${valueIndex}`)
        values.push(title)
        valueIndex += 1
      } else if (typeof body.text === 'string') {
        const title = parseTodoTitle(body.text)
        if (!title) return res.status(400).json({ error: 'title must not be empty' })
        updates.push(`title = $${valueIndex}`)
        values.push(title)
        valueIndex += 1
        updates.push(`text = $${valueIndex}`)
        values.push(title)
        valueIndex += 1
      }

      if (typeof body.content === 'string') {
        updates.push(`content = $${valueIndex}`)
        values.push(parseTodoContent(body.content))
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

      if (Array.isArray(body.labelTexts)) {
        const labelTexts = parseLabelTexts(body.labelTexts)
        const fallbackColor = parseLabelColor(body.labelColor || '#64748b') || '#64748b'
        const labelColors = parseLabelColors(body.labelColors, labelTexts.length, fallbackColor)
        updates.push(`label_text = $${valueIndex}`)
        values.push(labelTexts[0] || '')
        valueIndex += 1
        updates.push(`label_color = $${valueIndex}`)
        values.push(labelTexts.length > 0 ? labelColors[0] : '#64748b')
        valueIndex += 1
        updates.push(`label_texts = $${valueIndex}::jsonb`)
        values.push(JSON.stringify(labelTexts))
        valueIndex += 1
        updates.push(`label_colors = $${valueIndex}::jsonb`)
        values.push(JSON.stringify(labelColors))
        valueIndex += 1
      }

      if (!Array.isArray(body.labelTexts) && typeof body.labelText === 'string') {
        const labelText = body.labelText.trim().slice(0, 32)
        const labelColor = parseLabelColor(body.labelColor || '#64748b') || '#64748b'
        updates.push(`label_text = $${valueIndex}`)
        values.push(labelText)
        valueIndex += 1
        updates.push(`label_texts = $${valueIndex}::jsonb`)
        values.push(JSON.stringify(labelText ? [labelText] : []))
        valueIndex += 1
        updates.push(`label_color = $${valueIndex}`)
        values.push(labelText ? labelColor : '#64748b')
        valueIndex += 1
        updates.push(`label_colors = $${valueIndex}::jsonb`)
        values.push(JSON.stringify(labelText ? [labelColor] : []))
        valueIndex += 1
      }

      if (typeof body.labelColor === 'string') {
        const labelColor = parseLabelColor(body.labelColor)
        if (!labelColor) return res.status(400).json({ error: 'labelColor must be a valid hex color' })
        updates.push(`label_color = $${valueIndex}`)
        values.push(labelColor)
        valueIndex += 1
        if (!Array.isArray(body.labelTexts) && typeof body.labelText !== 'string') {
          updates.push(`label_colors = CASE WHEN btrim(label_text) = '' THEN '[]'::jsonb ELSE jsonb_build_array($${valueIndex}) END`)
          values.push(labelColor)
          valueIndex += 1
        }
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
        } RETURNING id, title, content, text, status, done, due_at, location, label_text, label_color, label_texts, label_colors, rollover_enabled, position, created_at;`,
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
