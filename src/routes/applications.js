import { Router } from 'express'
import nodemailer from 'nodemailer'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { queryPaginatedList } from '../utils/pagination.js'
import { deleteById } from '../utils/crud.js'

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

function parseApplicationInput(body) {
  return {
    fullName: cleanText(body.fullName, 120),
    email: cleanText(body.email, 254),
    phone: cleanText(body.phone, 40),
    coverLetter: cleanText(body.coverLetter, 5000),
    linkedinUrl: cleanText(body.linkedinUrl, 500),
    portfolioUrl: cleanText(body.portfolioUrl, 500),
    jobId: body.jobId ? Number(body.jobId) : null,
    jobTitle: cleanText(body.jobTitle, 255),
  }
}

function validateApplicationInput({ fullName, email }) {
  if (!fullName) return 'Full name is required'
  if (!email || !isValidEmail(email)) return 'Valid email is required'
  return null
}

async function jobExists(jobId) {
  if (!jobId) return true
  const { rowCount } = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId])
  return rowCount > 0
}

async function insertApplication(fields) {
  const { jobId, jobTitle, fullName, email, phone, coverLetter, linkedinUrl, portfolioUrl } = fields
  const { rows } = await pool.query(
    `INSERT INTO job_applications
       (job_id, job_title, full_name, email, phone, cover_letter, linkedin_url, portfolio_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [jobId, jobTitle || null, fullName, email, phone || null, coverLetter || null, linkedinUrl || null, portfolioUrl || null]
  )
  return rows[0]
}

function buildApplicationEmailHtml({ jobTitle, fullName, email, phone, linkedinUrl, portfolioUrl, coverLetter }) {
  const positionRow = jobTitle ? `<p style="margin:0 0 6px"><b>Position:</b> ${escapeLt(jobTitle)}</p>` : ''
  const phoneRow = phone ? `<p style="margin:0 0 6px"><b>Phone:</b> ${escapeLt(phone)}</p>` : ''
  const linkedinRow = linkedinUrl ? `<p style="margin:0 0 6px"><b>LinkedIn:</b> ${escapeLt(linkedinUrl)}</p>` : ''
  const portfolioRow = portfolioUrl ? `<p style="margin:0 0 6px"><b>Portfolio:</b> ${escapeLt(portfolioUrl)}</p>` : ''
  const coverRow = coverLetter
    ? `<p style="margin:16px 0 6px"><b>Cover Letter:</b></p>
       <pre style="margin:0;padding:12px;background:#f6f7f8;white-space:pre-wrap">${escapeLt(coverLetter)}</pre>`
    : ''

  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 16px">New Job Application</h2>
      ${positionRow}
      <p style="margin:0 0 6px"><b>Name:</b> ${escapeLt(fullName)}</p>
      <p style="margin:0 0 6px"><b>Email:</b> ${escapeLt(email)}</p>
      ${phoneRow}
      ${linkedinRow}
      ${portfolioRow}
      ${coverRow}
    </div>`.trim()
}

/** Best-effort email notification — caller decides whether failures matter. */
async function sendApplicationEmail(fields) {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return

  const port = Number(process.env.SMTP_PORT || 587)
  const toEmail = process.env.CONTACT_TO_EMAIL || 'info@jashom.com'
  const fromEmail = process.env.SMTP_FROM_EMAIL || user
  const fromName = process.env.SMTP_FROM_NAME || 'Jashom Careers'
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  const subject = `New Job Application: ${fields.jobTitle || 'General'} — ${fields.fullName}`
  const html = buildApplicationEmailHtml(fields)

  await transporter.sendMail({ from: `"${fromName}" <${fromEmail}>`, to: toEmail, subject, html, replyTo: fields.email })
}

/** POST /v1/applications — submit job application (public) */
router.post('/', async (req, res) => {
  try {
    const fields = parseApplicationInput(req.body || {})
    const validationError = validateApplicationInput(fields)
    if (validationError) return res.status(400).json({ error: validationError })

    if (!(await jobExists(fields.jobId))) {
      return res.status(404).json({ error: 'This job posting is no longer available' })
    }

    let application
    try {
      application = await insertApplication(fields)
    } catch (err) {
      if (err.code === '23503') {
        return res.status(404).json({ error: 'This job posting is no longer available' })
      }
      throw err
    }

    try {
      await sendApplicationEmail(fields)
    } catch (emailErr) {
      console.warn('application email failed (non-fatal):', emailErr.message)
    }

    res.status(201).json({ ok: true, id: application.id })
  } catch (err) {
    console.error('POST /v1/applications', err)
    res.status(500).json({ error: err.message })
  }
})

/** GET /v1/applications — list all applications (admin only, ?job_id=X&status=new) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { job_id, status, limit, offset } = req.query
    const { rows } = await queryPaginatedList({
      baseQuery: `
        SELECT a.*, j.title as job_title_live
        FROM job_applications a
        LEFT JOIN jobs j ON j.id = a.job_id
        WHERE 1=1`,
      filters: [['a.job_id', job_id], ['a.status', status]],
      orderBy: 'ORDER BY a.applied_at DESC',
      limit, offset, defaultLimit: 100, maxLimit: 500,
    })
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
    const deleted = await deleteById('job_applications', req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Application not found' })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
