import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const JOB_COLUMNS = [
  'title', 'slug', 'department', 'location', 'employment_type',
  'experience', 'salary_range', 'description', 'requirements',
  'status', 'posted_at', 'closes_at', 'sort_order',
]

/** GET /v1/admin/jobs — list jobs (?status=published&limit=50&offset=0) */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    let query = 'SELECT * FROM jobs WHERE 1=1'
    const params = []
    let i = 1
    if (status) { query += ` AND status = $${i++}`; params.push(status) }
    query += ' ORDER BY sort_order ASC, posted_at DESC NULLS LAST, created_at DESC'
    query += ` LIMIT $${i} OFFSET $${i + 1}`
    params.push(Math.min(Number(limit) || 50, 200), Number(offset) || 0)
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /v1/admin/jobs/:id */
router.get('/:id', async (req, res) => {
  try {
    const { rows, rowCount } = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Job not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /v1/admin/jobs — create (auth required) */
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.title || !body.slug) return res.status(400).json({ error: 'title and slug are required' })
    const cols = [], vals = []
    let p = 1
    for (const col of JOB_COLUMNS) {
      if (body[col] !== undefined) { cols.push(col); vals.push(body[col]); p++ }
    }
    const { rows } = await pool.query(
      `INSERT INTO jobs (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
      vals
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** PUT /v1/admin/jobs/:id — update (auth required) */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const body = req.body || {}
    const updates = [], vals = []
    let p = 1
    for (const col of JOB_COLUMNS) {
      if (body[col] !== undefined) { updates.push(`${col} = $${p++}`); vals.push(body[col]) }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    vals.push(req.params.id)
    const { rows, rowCount } = await pool.query(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${p} RETURNING *`,
      vals
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Job not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /v1/admin/jobs/:id (auth required) */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM jobs WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Job not found' })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
