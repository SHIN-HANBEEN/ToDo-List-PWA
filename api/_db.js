import { Pool } from 'pg'

let pool
let schemaPromise

function getConnectionString() {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ''
  )
}

export function getPool() {
  if (pool) return pool

  const connectionString = getConnectionString()
  if (!connectionString) {
    throw new Error('Missing database connection string. Set DATABASE_URL or POSTGRES_URL.')
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  })

  return pool
}

export async function ensureSchema() {
  if (schemaPromise) return schemaPromise

  schemaPromise = (async () => {
    const client = await getPool().connect()
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          done BOOLEAN NOT NULL DEFAULT FALSE,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id BIGSERIAL PRIMARY KEY,
          todo_id BIGINT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)

      await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;')

      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_todos_position_created ON todos(position, created_at DESC);'
      )
      await client.query('CREATE INDEX IF NOT EXISTS idx_todos_user_position ON todos(user_id, position, created_at DESC);')
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_comments_todo_created ON comments(todo_id, created_at DESC);'
      )
      await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at DESC);')
    } finally {
      client.release()
    }
  })()

  return schemaPromise
}

export function normalizeTodoRow(row) {
  return {
    id: Number(row.id),
    text: row.text,
    done: row.done,
    position: row.position,
    createdAt: row.created_at,
    comments: [],
  }
}

export function normalizeCommentRow(row) {
  return {
    id: Number(row.id),
    todoId: Number(row.todo_id),
    text: row.text,
    createdAt: row.created_at,
  }
}
