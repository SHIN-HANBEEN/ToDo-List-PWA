# Todogram (Vue 3 + Vercel + Postgres)

Features:

- email/password signup and login
- user-scoped todos (each user sees only their own data)
- drag-and-drop todo ordering
- detail comments per todo
- PWA install support
- 30-minute reminder push notifications (Web Push + PWA)

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173`.

## Database setup (Vercel + Neon)

1. In Vercel dashboard, open this project.
2. Connect `Neon` in Storage/Marketplace.
3. Confirm env vars are set (`POSTGRES_URL` or `DATABASE_URL`).
4. Pull env vars locally:

```sh
npx vercel env pull .env.local
```

## API routes

- `GET /api/auth` (current session user)
- `POST /api/auth` with `{ action: "signup" | "login", email, password }`
- `DELETE /api/auth` (logout)
- `GET /api/todos`
- `POST /api/todos`
- `PATCH /api/todos`
- `DELETE /api/todos?id=...`
- `DELETE /api/todos?done=true`
- `POST /api/comments`
- `DELETE /api/comments?id=...`
- `GET /api/notifications/subscriptions`
- `POST /api/notifications/subscriptions`
- `DELETE /api/notifications/subscriptions`
- `GET /api/notifications/reminders` (cron only)

## Push reminder setup (30 minutes before due time)

1. Generate VAPID keys:

```sh
npx web-push generate-vapid-keys
```

2. Add these environment variables in Vercel and local `.env.local`:

- `VITE_WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT` (example: `mailto:you@example.com`)
- `CRON_SECRET` (used by `/api/notifications/reminders`)

3. Add GitHub repository secret:
- `CRON_SECRET`

4. Reminder scheduler runs via GitHub Actions:
- `.github/workflows/reminder-cron.yml` (every 5 minutes)
- calls `https://todo-list-pwa-xi.vercel.app/api/notifications/reminders`

5. On device/browser, allow notifications in app settings and keep the PWA installed for best iOS behavior.

## Deploy

```sh
npx vercel --prod
```
