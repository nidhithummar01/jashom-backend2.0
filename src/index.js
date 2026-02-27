import express from 'express'
import cors from 'cors'
import { pool } from './db.js'
import blogRoutes from './routes/blogs.js'
import authRoutes from './routes/auth.js'
import { env } from './config.js'

const app = express()

// Allow admin panel (and other origins in dev) to call the API
app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // true = reflect request origin; or set e.g. http://localhost:5173
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

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

app.listen(env.port, () => {
  console.log(`Jashom backend running on http://localhost:${env.port}`)
})

export { app, pool }
