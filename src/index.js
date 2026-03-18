import express from 'express'
import cors from 'cors'
import { pool } from './db.js'
import blogRoutes from './routes/blogs.js'
import authRoutes from './routes/auth.js'
import contactRoutes from './routes/contact.js'
import { env } from './config.js'

const app = express()

// Allow frontend (www.jashom.com, localhost) and admin to call the API
const corsOrigin = process.env.CORS_ORIGIN
/** @type {boolean | string | string[]} */
let corsOriginOption
if (!corsOrigin) {
  // Reflect request origin so any frontend origin works
  corsOriginOption = true
} else if (corsOrigin.includes(',')) {
  corsOriginOption = corsOrigin.split(',').map((o) => o.trim())
} else {
  corsOriginOption = corsOrigin.trim()
}
app.use(cors({
  origin: corsOriginOption,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '50mb' }))

/** API root — so requests to base URL get JSON, not HTML (helps verify backend is hit in production) */
app.get('/', (_, res) => res.json({ api: 'v1', docs: { blogs: 'GET /v1/admin/blogs', health: 'GET /health' } }))
app.get('/v1', (_, res) => res.json({ admin: { blogs: '/v1/admin/blogs', auth: '/v1/admin/auth' } }))

/** Health check — GET /health */
app.get('/health', async (_, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

app.use('/v1/admin/auth', authRoutes)
app.use('/v1/admin/blogs', blogRoutes)
app.use('/v1/contact', contactRoutes)

app.listen(env.port, () => {
  console.log(`Jashom backend running on http://localhost:${env.port}`)
})

export { app, pool }
