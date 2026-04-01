# Jashom Backend

Node + Express backend using **PostgreSQL on Supabase**.

## 1. Env setup

Copy the example env and add your Supabase values:

```bash
cp .env.example .env
```

Edit `.env` (see `.env.example`):

- **DATABASE_URL** — Postgres connection string (Supabase: Dashboard → Project Settings → Database → Connection string URI)
- **PORT** — Server port (default `5000` in this repo)

### Contact form email (SendGrid)

All frontend contact forms POST to `POST /v1/contact` and the server sends mail via **SMTP** (nodemailer).

- **SMTP_HOST** — e.g. `smtp.sendgrid.net`
- **SMTP_PORT** — usually `587` (TLS) or `465` (SSL)
- **SMTP_USER** — for SendGrid this is always the literal string `apikey`
- **SMTP_PASS** — your **SendGrid API key** (not the same as “new API key” wording in the UI—you create one key and paste it here)
- **CONTACT_TO_EMAIL** — company inbox that receives every submission (default in code: `info@jashom.com`). Set this in production `.env` to be sure.
- **CONTACT_FROM_EMAIL** — must be a **verified sender** in SendGrid (recommended: `info@jashom.com` if that address is verified). If unset, the server uses `CONTACT_TO_EMAIL` as the From address.

If mail works in one environment but not on the live site, the live server usually has missing `SMTP_*` env vars, an unverified From domain, or SendGrid blocking the message (check SendGrid Activity).

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
