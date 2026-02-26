import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { env } from '../config.js'

const router = Router()

/** POST /login — admin login (email + password), returns JWT and admin (no password) */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const { rows, rowCount } = await pool.query(
      'SELECT id, email, password_hash, name, created_at FROM admins WHERE email = $1',
      [email.trim().toLowerCase()]
    )
    if (rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const admin = rows[0]
    const match = await bcrypt.compare(password, admin.password_hash)
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = jwt.sign(
      { sub: admin.id, email: admin.email },
      env.jwtSecret,
      { expiresIn: '7d' }
    )
    const { password_hash, ...safe } = admin
    res.json({ token, admin: safe })
  } catch (err) {
    console.error('POST /login', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
