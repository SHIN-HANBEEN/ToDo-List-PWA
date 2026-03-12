# Todogram (Vue 3 + Vercel + Postgres)

Features:

- email/password signup and login
- user-scoped todos (each user sees only their own data)
- drag-and-drop todo ordering
- detail comments per todo
- PWA install support
- 30-minute reminder push notifications (Web Push + PWA)

## UI styling workflow

For UI work in this repository, use the `toss-ui` skill and read references in this order:

1. `C:/Users/user/.codex/skills/toss-ui/references/source-map.md`
2. `C:/Users/user/.codex/skills/toss-ui/references/mobile-tablet-patterns.md`
   - Required when the task affects responsive behavior, phone/tablet UI, bottom sheets, sticky CTA, touch density, or safe-area handling.
3. `C:/C-Projects/toss_style_folder/toss_style_system.md`
4. `C:/C-Projects/toss_style_folder/TAILWIND_THEME_GUIDE.md`

Open implementation files only when exact token names or project wiring are needed:

- `theme/tailwind.todo.toss.preset.cjs`
- `tailwind.config.js`
- `src/style.css`
- `src/App.vue`

Responsive work should stay mobile-first and treat tablet as an expanded mobile experience before adding extra regions or desktop-style navigation.

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
- `POST /api/improvements`
- `GET /api/improvements` (admin only)
- `DELETE /api/improvements?id=...` (admin only)
- `GET /api/notifications` (subscription config)
- `POST /api/notifications` (register/update subscription)
- `DELETE /api/notifications` (remove subscription)
- `GET /api/notifications?mode=reminders` (cron only)

## Push reminder setup (30 minutes before due time)

1. Generate VAPID keys:

```sh
npx web-push generate-vapid-keys
```

2. Add these environment variables in Vercel and local `.env.local`:

- `VITE_WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT` (example: `mailto:you@example.com`)
- `CRON_SECRET` (used by `/api/notifications?mode=reminders`)

3. Add GitHub repository secret:
- `CRON_SECRET`

4. Reminder scheduler runs via GitHub Actions:
- `.github/workflows/reminder-cron.yml` (every 5 minutes)
- calls `https://todo-list-pwa-xi.vercel.app/api/notifications?mode=reminders`

5. On device/browser, allow notifications in app settings and keep the PWA installed for best iOS behavior.

## Deploy

```sh
npx vercel --prod
```

