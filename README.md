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

Server runs at `http://localhost:5000`. `GET /health` returns `{ "ok": true, "message": "your health is healthy" }`.

---

Next: add your API routes and logic (you’ll give instructions).
