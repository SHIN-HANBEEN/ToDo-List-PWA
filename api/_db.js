import { Pool } from 'pg'

let pool
let schemaPromise

function getConnectionString() {
  // Prefer Vercel/Neon env vars first, and allow DATABASE_URL for local development.
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ''
  )
}

export function getPool() {
  // Reuse the pool in a warm serverless instance.
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
  // Run schema DDL once per warm runtime to avoid repeated CREATE TABLE cost.
  if (schemaPromise) return schemaPromise

  schemaPromise = (async () => {
    const client = await getPool().connect()
    try {
      // users stores account data, sessions maps browser cookie tokens to users.
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
          title TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          text TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
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

      // Safe migrations for compatibility with already-deployed schemas.
      await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE;')
      await client.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;')
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';")
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS label_text TEXT NOT NULL DEFAULT '';")
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS label_color TEXT NOT NULL DEFAULT '#64748b';")
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';")
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';")
      await client.query(`
        UPDATE todos
        SET title = COALESCE(NULLIF(btrim(title), ''), NULLIF(btrim(text), ''), 'Untitled')
        WHERE title IS NULL OR btrim(title) = '';
      `)
      await client.query(`
        UPDATE todos
        SET content = ''
        WHERE content IS NULL;
      `)
      await client.query(`
        UPDATE todos
        SET text = title
        WHERE text IS DISTINCT FROM title;
      `)
      await client.query("ALTER TABLE todos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';")
      await client.query(`
        UPDATE todos
        SET status = CASE
          WHEN done = TRUE THEN 'done'
          WHEN status IS NULL OR lower(btrim(status)) NOT IN ('waiting', 'active', 'done') THEN 'active'
          ELSE lower(btrim(status))
        END;
      `)
      await client.query(`
        UPDATE todos
        SET done = (status = 'done')
        WHERE done IS DISTINCT FROM (status = 'done');
      `)
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

      // Indexes for frequent query/sort patterns.
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
  const rawStatus = typeof row.status === 'string' ? row.status.trim().toLowerCase() : ''
  const title = String(row.title || '').trim() || String(row.text || '').trim()
  const content = typeof row.content === 'string' ? row.content : ''
  const status =
    rawStatus === 'waiting' || rawStatus === 'active' || rawStatus === 'done'
      ? rawStatus
      : row.done
        ? 'done'
        : 'active'

  return {
    id: Number(row.id),
    title,
    content,
    text: title,
    status,
    done: status === 'done',
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

