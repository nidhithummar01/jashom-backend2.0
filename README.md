# Jashom Backend

Node + Express backend using **PostgreSQL on Supabase**.

## 1. Env setup

Copy the example env and add your Supabase values:

```bash
cp .env.example .env
```

Edit `.env`:

- **DATABASE_URL** — Postgres connection string (Supabase: Dashboard → Project Settings → Database → Connection string URI)
- **PORT** — Server port (default `3000`)

## 2. Run migrations

Migrations live in **`migrate/`**. Add **DATABASE_URL** to your `.env`, then:

```bash
npm run migration
```

This runs every `*.sql` file in `migrate/` in order. You can also run the SQL manually in Supabase → SQL Editor.

## 3. Run the server

```bash
npm install
npm run dev
```

Server runs at `http://localhost:5000`. `GET /health` returns `{ "ok": true }`.

## 4. Live deployment (e.g. https://backend.jashom.com)

- **Base URL**: In the **frontend** build env set `VITE_API_URL=https://backend.jashom.com` (no trailing slash).
- **CORS**: On the backend server set `CORS_ORIGIN` to your live frontend origin (e.g. `https://jashom.com`) if needed. If unset, the server reflects the request origin.
- **Verify**: Open `https://backend.jashom.com/` or `https://backend.jashom.com/health` — you should see JSON. If you see HTML, the request is not reaching this Node app (check reverse proxy or hosting).

---

Next: add your API routes and logic (you’ll give instructions).
