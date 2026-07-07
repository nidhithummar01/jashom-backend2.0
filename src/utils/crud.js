import { pool } from '../db.js'

export async function findById(table, id) {
  const { rows, rowCount } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id])
  return rowCount > 0 ? rows[0] : null
}

export async function deleteById(table, id) {
  const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id])
  return rowCount > 0
}

/** Builds cols/vals/placeholders for a dynamic-column INSERT from an allowlist. */
export function buildInsertColumns(columns, body, transform = (_col, val) => val) {
  const cols = []
  const vals = []
  for (const col of columns) {
    if (body[col] !== undefined) {
      cols.push(col)
      vals.push(transform(col, body[col]))
    }
  }
  return { cols, vals, placeholders: cols.map((_, i) => `$${i + 1}`).join(', ') }
}

/** Builds `col = $n` assignments + vals for a dynamic-column UPDATE from an allowlist. */
export function buildUpdateAssignments(columns, body, transform = (_col, val) => val) {
  const assignments = []
  const vals = []
  let i = 1
  for (const col of columns) {
    if (body[col] !== undefined) {
      assignments.push(`${col} = $${i++}`)
      vals.push(transform(col, body[col]))
    }
  }
  return { assignments, vals, nextParam: i }
}
