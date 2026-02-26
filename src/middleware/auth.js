import jwt from 'jsonwebtoken'
import { env } from '../config.js'

/**
 * Middleware: require Authorization: Bearer <token>. Sets req.admin = { id, email } on success.
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.admin = { id: payload.sub, email: payload.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
