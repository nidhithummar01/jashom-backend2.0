import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { queryPaginatedList } from '../utils/pagination.js'
import { findById, deleteById, buildInsertColumns, buildUpdateAssignments } from '../utils/crud.js'

const router = Router()

// Match columns that exist in DB (og_image_* omitted if your migration doesn't add them)
const BLOG_COLUMNS = [
  'title', 'slug', 'excerpt', 'content', 'author_id', 'author_name', 'tags',
  'status', 'published_at', 'meta_title', 'meta_description', 'canonical_url', 'meta_robots',
  'schema_code',
  'featured_image_url', 'featured_image_alt', 'featured_image_name',
  'og_image_url', 'og_image_alt', 'og_image_name',
  'content_sections', // JSONB: array of { title, content, images: [ { url, alt, name } ] }
  'view_count', 'is_featured', 'is_pinned', 'sort_order', 'allow_comments'
]

function valueForDb(col, val) {
  if (col === 'content_sections' && val != null && typeof val === 'object') {
    return JSON.stringify(val)
  }
  return val
}

/** GET /blogs — fetch all blogs (optional: ?status=published&slug=my-post&limit=20&offset=0) */
router.get('/', async (req, res) => {
  try {
    const { status, slug, limit, offset } = req.query
    const { rows } = await queryPaginatedList({
      baseQuery: 'SELECT * FROM blogs WHERE 1=1',
      filters: [['status', status], ['slug', slug]],
      orderBy: 'ORDER BY sort_order ASC, published_at DESC NULLS LAST, created_at DESC',
      limit, offset, defaultLimit: 50, maxLimit: 100,
    })
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /blogs/:id — fetch blog by id */
router.get('/:id', async (req, res) => {
  try {
    const blog = await findById('blogs', req.params.id)
    if (!blog) return res.status(404).json({ error: 'Blog not found' })
    res.json(blog)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /blogs — create blog */
router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.title || !body.slug || body.content === undefined) {
      return res.status(400).json({ error: 'title, slug, and content are required' })
    }
    const { cols, vals, placeholders } = buildInsertColumns(BLOG_COLUMNS, body, valueForDb)
    if (cols.length === 0) {
      return res.status(400).json({ error: 'Provide at least title, slug, content' })
    }
    const { rows } = await pool.query(
      `INSERT INTO blogs (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** PUT /blogs/:id — update blog (auth required) */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const body = req.body || {}
    const { assignments, vals, nextParam } = buildUpdateAssignments(BLOG_COLUMNS, body, valueForDb)
    if (assignments.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    vals.push(req.params.id)
    const { rows, rowCount } = await pool.query(
      `UPDATE blogs SET ${assignments.join(', ')} WHERE id = $${nextParam} RETURNING *`,
      vals
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    res.json(rows[0])
  } catch (err) {
    console.error('PUT /blogs/:id', err)
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /blogs/:id — delete blog (auth required) */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteById('blogs', req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
