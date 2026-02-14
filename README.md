# Todogram (Vue 3 + Vercel + Postgres)

Features:

- email/password signup and login
- user-scoped todos (each user sees only their own data)
- drag-and-drop todo ordering
- detail comments per todo
- PWA install support

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

## Deploy

```sh
npx vercel --prod
```
