import { Router } from 'express'
import nodemailer from 'nodemailer'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function cleanText(v, max) {
  if (v == null) return ''
  const s = String(v).trim()
  return s.length > max ? s.slice(0, max) : s
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false
  const e = email.trim()
  const at = e.indexOf('@')
  const domain = e.slice(at + 1)
  return at > 0 && domain.indexOf('.') > 0 && !e.includes(' ')
}

function escapeLt(s) { return String(s).replace(/</g, '&lt;') }

/** POST /v1/applications — submit job application (public) */
router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const fullName    = cleanText(body.fullName, 120)
    const email       = cleanText(body.email, 254)
    const phone       = cleanText(body.phone, 40)
    const coverLetter = cleanText(body.coverLetter, 5000)
    const linkedinUrl = cleanText(body.linkedinUrl, 500)
    const portfolioUrl= cleanText(body.portfolioUrl, 500)
    const jobId       = body.jobId ? Number(body.jobId) : null
    const jobTitle    = cleanText(body.jobTitle, 255)

    if (!fullName) return res.status(400).json({ error: 'Full name is required' })
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Valid email is required' })

    if (jobId) {
      const jobCheck = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId])
      if (jobCheck.rowCount === 0) {
        return res.status(404).json({ error: 'This job posting is no longer available' })
      }
    }

    // Save to DB
    let rows
    try {
      ;({ rows } = await pool.query(
        `INSERT INTO job_applications
           (job_id, job_title, full_name, email, phone, cover_letter, linkedin_url, portfolio_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [jobId, jobTitle || null, fullName, email, phone || null, coverLetter || null, linkedinUrl || null, portfolioUrl || null]
      ))
    } catch (err) {
      if (err.code === '23503') {
        return res.status(404).json({ error: 'This job posting is no longer available' })
      }
      throw err
    }

    // Send email notification (best-effort — don't fail the request if email fails)
    try {
      const host = process.env.SMTP_HOST
      const port = Number(process.env.SMTP_PORT || 587)
      const user = process.env.SMTP_USER
      const pass = process.env.SMTP_PASS
      const toEmail = process.env.CONTACT_TO_EMAIL || 'info@jashom.com'

      if (host && user && pass) {
        const fromEmail = process.env.SMTP_FROM_EMAIL || user
        const fromName  = process.env.SMTP_FROM_NAME  || 'Jashom Careers'
        const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
        const subject = `New Job Application: ${jobTitle || 'General'} — ${fullName}`
        const html = `
          <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
            <h2 style="margin:0 0 16px">New Job Application</h2>
            ${jobTitle ? `<p style="margin:0 0 6px"><b>Position:</b> ${escapeLt(jobTitle)}</p>` : ''}
            <p style="margin:0 0 6px"><b>Name:</b> ${escapeLt(fullName)}</p>
            <p style="margin:0 0 6px"><b>Email:</b> ${escapeLt(email)}</p>
            ${phone ? `<p style="margin:0 0 6px"><b>Phone:</b> ${escapeLt(phone)}</p>` : ''}
            ${linkedinUrl ? `<p style="margin:0 0 6px"><b>LinkedIn:</b> ${escapeLt(linkedinUrl)}</p>` : ''}
            ${portfolioUrl ? `<p style="margin:0 0 6px"><b>Portfolio:</b> ${escapeLt(portfolioUrl)}</p>` : ''}
            ${coverLetter ? `<p style="margin:16px 0 6px"><b>Cover Letter:</b></p>
            <pre style="margin:0;padding:12px;background:#f6f7f8;white-space:pre-wrap">${escapeLt(coverLetter)}</pre>` : ''}
          </div>`.trim()

        await transporter.sendMail({ from: `"${fromName}" <${fromEmail}>`, to: toEmail, subject, html, replyTo: email })
      }
    } catch (emailErr) {
      console.warn('application email failed (non-fatal):', emailErr.message)
    }

    res.status(201).json({ ok: true, id: rows[0].id })
  } catch (err) {
    console.error('POST /v1/applications', err)
    res.status(500).json({ error: err.message })
  }
})

/** GET /v1/applications — list all applications (admin only, ?job_id=X&status=new) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { job_id, status, limit = 100, offset = 0 } = req.query
    let query = `
      SELECT a.*, j.title as job_title_live
      FROM job_applications a
      LEFT JOIN jobs j ON j.id = a.job_id
      WHERE 1=1`
    const params = []
    let i = 1
    if (job_id) { query += ` AND a.job_id = $${i++}`; params.push(job_id) }
    if (status) { query += ` AND a.status = $${i++}`; params.push(status) }
    query += ' ORDER BY a.applied_at DESC'
    query += ` LIMIT $${i} OFFSET $${i + 1}`
    params.push(Math.min(Number(limit) || 100, 500), Number(offset) || 0)
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** PUT /v1/applications/:id — update status (admin only) */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {}
    const valid = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired']
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const { rows, rowCount } = await pool.query(
      'UPDATE job_applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Application not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /v1/applications/:id (admin only) */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM job_applications WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Application not found' })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
