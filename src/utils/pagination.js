import { pool } from '../db.js'

/**
 * Runs a paginated SELECT built from an optional list of equality filters.
 * filters: array of [column, value] pairs — skipped when value is falsy.
 */
export async function queryPaginatedList({ baseQuery, filters = [], orderBy, limit, offset, defaultLimit, maxLimit }) {
  let query = baseQuery
  const params = []
  let i = 1
  for (const [column, value] of filters) {
    if (!value) continue
    query += ` AND ${column} = $${i++}`
    params.push(value)
  }
  query += ` ${orderBy} LIMIT $${i} OFFSET $${i + 1}`
  params.push(Math.min(Number(limit) || defaultLimit, maxLimit), Number(offset) || 0)
  return pool.query(query, params)
}
