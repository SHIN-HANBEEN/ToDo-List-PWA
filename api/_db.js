import { Pool } from 'pg'

let pool
let schemaPromise

function getConnectionString() {
  // Vercel/Neon 기본 환경 변수를 우선 사용하고, 로컬 개발용으로 DATABASE_URL도 허용.
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ''
  )
}

export function getPool() {
  // 서버리스 런타임 인스턴스 내에서는 풀을 재사용.
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
  // 웜 런타임 동안 DDL을 한 번만 실행해 CREATE TABLE 반복 비용을 방지.
  if (schemaPromise) return schemaPromise

  schemaPromise = (async () => {
    const client = await getPool().connect()
    try {
      // users는 계정, sessions는 브라우저 쿠키 토큰을 사용자와 매핑.
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

      // 기존 배포본 호환을 위한 안전한 마이그레이션.
      await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;')

      // 자주 사용하는 조회/정렬 패턴 기준 인덱스.
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
  // Vue 클라이언트가 기대하는 응답 형태로 고정.
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
