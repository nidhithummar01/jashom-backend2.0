import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env (Postgres connection string)')
  process.exit(1)
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'jashom-admin-secret-change-in-production',
}
