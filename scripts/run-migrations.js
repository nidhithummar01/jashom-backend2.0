import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrateDir = path.join(path.dirname(__dirname), 'migrate')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env')
  process.exit(1)
}

const client = new pg.Client({ connectionString })

async function run() {
  try {
    await client.connect()
    const files = fs.readdirSync(migrateDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    if (files.length === 0) {
      console.log('No migration files in migrate/')
      return
    }

    for (const file of files) {
      const filePath = path.join(migrateDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      console.log(`Running ${file}...`)
      await client.query(sql)
      console.log(`  OK: ${file}`)
    }

    console.log(`Done. Ran ${files.length} migration(s).`)
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
