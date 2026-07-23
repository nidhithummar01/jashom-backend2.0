import express from 'express'
import { pool } from '../db.js'

const router = express.Router()

// GET /v1/authors — list all authors (public, used by admin dropdown + frontend)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, slug, role, bio, avatar_url, linkedin_url, twitter_url FROM public.authors ORDER BY name ASC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /v1/authors/:slug — single author by slug
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, slug, role, bio, avatar_url, linkedin_url, twitter_url FROM public.authors WHERE slug = $1',
      [req.params.slug]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Author not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
