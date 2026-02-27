import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Match columns that exist in DB (og_image_* omitted if your migration doesn't add them)
const BLOG_COLUMNS = [
  'title', 'slug', 'excerpt', 'content', 'author_id', 'author_name', 'tags',
  'status', 'published_at', 'meta_title', 'meta_description', 'canonical_url', 'meta_robots',
  'featured_image_url', 'featured_image_alt',
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
    const { status, slug, limit = 50, offset = 0 } = req.query
    let query = 'SELECT * FROM blogs WHERE 1=1'
    const params = []
    let i = 1
    if (status) {
      query += ` AND status = $${i++}`
      params.push(status)
    }
    if (slug) {
      query += ` AND slug = $${i++}`
      params.push(slug)
    }
    query += ' ORDER BY sort_order ASC, published_at DESC NULLS LAST, created_at DESC'
    query += ` LIMIT $${i} OFFSET $${i + 1}`
    params.push(Math.min(Number(limit) || 50, 100), Number(offset) || 0)
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /blogs/:id — fetch blog by id */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { rows, rowCount } = await pool.query(
      'SELECT * FROM blogs WHERE id = $1',
      [id]
    )
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /blogs — create blog */
router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const cols = []
    const vals = []
    let paramIndex = 1
    for (const col of BLOG_COLUMNS) {
      if (body[col] !== undefined) {
        cols.push(col)
        vals.push(valueForDb(col, body[col]))
        paramIndex++
      }
    }
    if (cols.length === 0) {
      return res.status(400).json({ error: 'Provide at least title, slug, content' })
    }
    if (!body.title || !body.slug || body.content === undefined) {
      return res.status(400).json({ error: 'title, slug, and content are required' })
    }
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
    const columns = cols.join(', ')
    const { rows } = await pool.query(
      `INSERT INTO blogs (${columns}) VALUES (${placeholders}) RETURNING *`,
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
    const { id } = req.params
    const body = req.body || {}
    const updates = []
    const vals = []
    let paramIndex = 1
    for (const col of BLOG_COLUMNS) {
      if (body[col] !== undefined) {
        updates.push(`${col} = $${paramIndex++}`)
        vals.push(valueForDb(col, body[col]))
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    vals.push(id)
    const whereParam = paramIndex
    const { rows, rowCount } = await pool.query(
      `UPDATE blogs SET ${updates.join(', ')} WHERE id = $${whereParam} RETURNING *`,
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
    const { id } = req.params
    const { rowCount } = await pool.query('DELETE FROM blogs WHERE id = $1', [id])
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
