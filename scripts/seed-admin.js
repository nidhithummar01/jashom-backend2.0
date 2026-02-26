import 'dotenv/config'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env')
  process.exit(1)
}

const client = new pg.Client({ connectionString })

const DEFAULT_EMAIL = 'admin@jashom.com'
const DEFAULT_PASSWORD = 'Admin@123' // change after first login in production

async function run() {
  try {
    await client.connect()
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    await client.query(
      `INSERT INTO admins (email, password_hash, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [DEFAULT_EMAIL, passwordHash, 'Main Admin']
    )
    console.log('Admin seed done. Default login: %s / %s', DEFAULT_EMAIL, DEFAULT_PASSWORD)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
