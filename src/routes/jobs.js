import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { queryPaginatedList } from '../utils/pagination.js'
import { findById, deleteById, buildInsertColumns, buildUpdateAssignments } from '../utils/crud.js'

const router = Router()

const JOB_COLUMNS = [
  'title', 'slug', 'department', 'location', 'employment_type',
  'experience', 'salary_range', 'description', 'requirements',
  'status', 'posted_at', 'closes_at', 'sort_order',
]

/** GET /v1/admin/jobs — list jobs (?status=published&limit=50&offset=0) */
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query
    const { rows } = await queryPaginatedList({
      baseQuery: 'SELECT * FROM jobs WHERE 1=1',
      filters: [['status', status]],
      orderBy: 'ORDER BY sort_order ASC, posted_at DESC NULLS LAST, created_at DESC',
      limit, offset, defaultLimit: 50, maxLimit: 200,
    })
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /v1/admin/jobs/:id */
router.get('/:id', async (req, res) => {
  try {
    const job = await findById('jobs', req.params.id)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /v1/admin/jobs — create (auth required) */
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.title || !body.slug) return res.status(400).json({ error: 'title and slug are required' })
    const { cols, vals, placeholders } = buildInsertColumns(JOB_COLUMNS, body)
    const { rows } = await pool.query(
      `INSERT INTO jobs (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
    const { assignments, vals, nextParam } = buildUpdateAssignments(JOB_COLUMNS, body)
    if (assignments.length === 0) return res.status(400).json({ error: 'No fields to update' })
    vals.push(req.params.id)
    const { rows, rowCount } = await pool.query(
      `UPDATE jobs SET ${assignments.join(', ')} WHERE id = $${nextParam} RETURNING *`,
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
    const deleted = await deleteById('jobs', req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Job not found' })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
