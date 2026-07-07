import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { queryPaginatedList } from './pagination.js'
import { findById, deleteById, buildInsertColumns, buildUpdateAssignments } from './crud.js'

const noAuth = (_req, _res, next) => next()

/**
 * Builds a standard list/get/create/update/delete router for a single table
 * from an allowlist of writable columns. Table name and messages are the only
 * things that vary between resources — the route wiring itself lives here once.
 */
export function createResourceRouter({
  table,
  label,
  columns,
  transform,
  list: { orderBy, defaultLimit, maxLimit, filters = [] },
  validateCreate,
  requireAuthOnWrite = true,
  requireAuthOnCreate = requireAuthOnWrite,
}) {
  const router = Router()
  const writeGuard = requireAuthOnWrite ? requireAuth : noAuth
  const createGuard = requireAuthOnCreate ? requireAuth : noAuth

  router.get('/', async (req, res) => {
    try {
      const { limit, offset } = req.query
      const { rows } = await queryPaginatedList({
        baseQuery: `SELECT * FROM ${table} WHERE 1=1`,
        filters: filters.map(([column, param]) => [column, req.query[param]]),
        orderBy, limit, offset, defaultLimit, maxLimit,
      })
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.get('/:id', async (req, res) => {
    try {
      const row = await findById(table, req.params.id)
      if (!row) return res.status(404).json({ error: `${label} not found` })
      res.json(row)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/', createGuard, async (req, res) => {
    try {
      const body = req.body || {}
      const validationError = validateCreate ? validateCreate(body) : null
      if (validationError) return res.status(400).json({ error: validationError })
      const { cols, vals, placeholders } = buildInsertColumns(columns, body, transform)
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        vals
      )
      res.status(201).json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/:id', writeGuard, async (req, res) => {
    try {
      const body = req.body || {}
      const { assignments, vals, nextParam } = buildUpdateAssignments(columns, body, transform)
      if (assignments.length === 0) return res.status(400).json({ error: 'No fields to update' })
      vals.push(req.params.id)
      const { rows, rowCount } = await pool.query(
        `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = $${nextParam} RETURNING *`,
        vals
      )
      if (rowCount === 0) return res.status(404).json({ error: `${label} not found` })
      res.json(rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.delete('/:id', writeGuard, async (req, res) => {
    try {
      const deleted = await deleteById(table, req.params.id)
      if (!deleted) return res.status(404).json({ error: `${label} not found` })
      res.status(204).send()
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}
