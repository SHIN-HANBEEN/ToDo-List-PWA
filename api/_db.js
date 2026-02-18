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
          username TEXT NOT NULL,
          avatar_url TEXT NOT NULL DEFAULT '',
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
          due_at TIMESTAMPTZ,
          location TEXT NOT NULL DEFAULT '',
          label_text TEXT NOT NULL DEFAULT '',
          label_color TEXT NOT NULL DEFAULT '#64748b',
          rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS labels (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT '#64748b',
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

      await client.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          locale TEXT NOT NULL DEFAULT 'en-US',
          timezone TEXT NOT NULL DEFAULT 'UTC',
          user_agent TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS todo_reminder_logs (
          id BIGSERIAL PRIMARY KEY,
          todo_id BIGINT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          due_at TIMESTAMPTZ NOT NULL,
          reminder_type TEXT NOT NULL,
          sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (todo_id, reminder_type, due_at)
        );
      `)

      // 기존 배포본 호환을 위한 안전한 마이그레이션.
      await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;')
      await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;')
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';")
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS label_text TEXT NOT NULL DEFAULT '';")
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS label_color TEXT NOT NULL DEFAULT '#64748b';")
      await client.query(`
        UPDATE todos
        SET label_color = '#64748b'
        WHERE label_color IS NULL OR btrim(label_color) = '';
      `)
      await client.query('ALTER TABLE labels ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;')
      await client.query('ALTER TABLE labels ADD COLUMN IF NOT EXISTS name TEXT;')
      await client.query("ALTER TABLE labels ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#64748b';")
      await client.query(`
        UPDATE labels
        SET color = '#64748b'
        WHERE color IS NULL OR btrim(color) = '';
      `)
      await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE;')
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;')
      await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';")
      await client.query(`
        UPDATE users
        SET username = COALESCE(NULLIF(split_part(email, '@', 1), ''), 'user' || id::text)
        WHERE username IS NULL OR btrim(username) = '';
      `)
      await client.query('ALTER TABLE users ALTER COLUMN username SET NOT NULL;')
      await client.query(`
        UPDATE users
        SET avatar_url = ''
        WHERE avatar_url IS NULL;
      `)
      await client.query("ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en-US';")
      await client.query("ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';")
      await client.query("ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT '';")
      await client.query('ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();')
      await client.query(`
        UPDATE push_subscriptions
        SET locale = 'en-US'
        WHERE locale IS NULL OR btrim(locale) = '';
      `)
      await client.query(`
        UPDATE push_subscriptions
        SET timezone = 'UTC'
        WHERE timezone IS NULL OR btrim(timezone) = '';
      `)
      await client.query(`
        UPDATE push_subscriptions
        SET user_agent = ''
        WHERE user_agent IS NULL;
      `)

      // 자주 사용하는 조회/정렬 패턴 기준 인덱스.
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_todos_position_created ON todos(position, created_at DESC);'
      )
      await client.query('CREATE INDEX IF NOT EXISTS idx_todos_user_position ON todos(user_id, position, created_at DESC);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_todos_user_due_at ON todos(user_id, due_at);')
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_labels_user_name_unique ON labels(user_id, name);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_labels_user_created ON labels(user_id, created_at DESC);')
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_comments_todo_created ON comments(todo_id, created_at DESC);'
      )
      await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at DESC);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_seen ON push_subscriptions(last_seen_at DESC);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_todo_reminder_logs_todo_sent ON todo_reminder_logs(todo_id, sent_at DESC);')
      await client.query('CREATE INDEX IF NOT EXISTS idx_todo_reminder_logs_user_sent ON todo_reminder_logs(user_id, sent_at DESC);')

      await client.query(`
        INSERT INTO labels (user_id, name, color)
        SELECT
          t.user_id,
          t.label_text,
          COALESCE(NULLIF(btrim(t.label_color), ''), '#64748b')
        FROM todos t
        WHERE t.user_id IS NOT NULL
          AND btrim(t.label_text) <> ''
        ON CONFLICT (user_id, name) DO NOTHING;
      `)
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
    dueAt: row.due_at,
    location: row.location || '',
    labelText: row.label_text || '',
    labelColor: row.label_color || '#64748b',
    rolloverEnabled: row.rollover_enabled,
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

export function normalizeLabelRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    color: row.color || '#64748b',
    createdAt: row.created_at,
  }
}
