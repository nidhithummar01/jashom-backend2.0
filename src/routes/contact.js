import { Router } from 'express'
import nodemailer from 'nodemailer'

const router = Router()

function isValidEmail(email) {
  if (typeof email !== 'string') return false
  const e = email.trim()
  if (e.length < 5 || e.length > 254) return false
  // basic sanity check (linear time; avoids regex backtracking)
  const at = e.indexOf('@')
  const domain = e.slice(at + 1)
  const dot = domain.indexOf('.')
  return (
    !e.includes(' ') &&
    at > 0 &&
    e.indexOf('@', at + 1) === -1 &&
    domain.length > 0 &&
    dot > 0 &&
    dot < domain.length - 1
  )
}

function cleanText(v, maxLen) {
  if (v == null) return ''
  const s = String(v).trim()
  if (s.length > maxLen) return s.slice(0, maxLen)
  return s
}

function mustEnv(name) {
  const v = process.env[name]
  if (!v || !String(v).trim()) throw new Error(`Missing ${name} in environment`)
  return String(v).trim()
}

function optionalEnv(name, fallback) {
  const v = process.env[name]
  return (v && String(v).trim()) ? String(v).trim() : fallback
}

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const fullName = cleanText(body.fullName, 120)
    const email = cleanText(body.email, 254)
    const phone = cleanText(body.phone, 40)
    const company = cleanText(body.company, 160)
    const message = cleanText(body.message, 5000)

    if (!fullName) return res.status(400).json({ error: 'Name is required' })
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Valid email is required' })
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const host = mustEnv('SMTP_HOST')
    const port = Number(mustEnv('SMTP_PORT'))
    const user = mustEnv('SMTP_USER')
    const pass = mustEnv('SMTP_PASS')
    // Default recipient for contact form submissions
    const to = optionalEnv('CONTACT_TO_EMAIL', 'nidhi.thummar@jashom.com')
    // SendGrid SMTP commonly uses SMTP_USER="apikey" (not a valid email address).
    // Always use a real/verified sender email so delivery works reliably in production.
    const configuredFrom = optionalEnv('CONTACT_FROM_EMAIL', '')
    const from = isValidEmail(configuredFrom) ? configuredFrom : to

    console.log('contact form: sending to', to, 'from', email, 'name', fullName)
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const companySuffix = company ? ` (${company})` : ''
    const subject = `New contact form: ${fullName}${companySuffix}`
    const text = [
      `Name: ${fullName}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      company ? `Company: ${company}` : null,
      '',
      'Message:',
      message,
      '',
      `Sent from: ${req.get('origin') || req.get('referer') || 'unknown'}`,
      `IP: ${req.ip}`,
      `UA: ${req.get('user-agent') || 'unknown'}`,
    ].filter(Boolean).join('\n')

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">
        <h2 style="margin:0 0 12px">New contact form submission</h2>
        <p style="margin:0 0 6px"><b>Name:</b> ${fullName.replace(/</g, '&lt;')}</p>
        <p style="margin:0 0 6px"><b>Email:</b> ${email.replace(/</g, '&lt;')}</p>
        ${phone ? `<p style="margin:0 0 6px"><b>Phone:</b> ${phone.replace(/</g, '&lt;')}</p>` : ''}
        ${company ? `<p style="margin:0 0 6px"><b>Company:</b> ${company.replace(/</g, '&lt;')}</p>` : ''}
        <p style="margin:16px 0 6px"><b>Message:</b></p>
        <pre style="margin:0;padding:12px;background:#f6f7f8;border-radius:8px;white-space:pre-wrap">${message.replace(/</g, '&lt;')}</pre>
      </div>
    `.trim()

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      replyTo: email,
    })

    // Helpful delivery debugging (SendGrid accepts/rejects are visible here)
    console.log('contact mail sent', {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: info?.response,
    })

    const rejected = Array.isArray(info?.rejected) ? info.rejected : []
    if (rejected.length > 0) {
      return res.status(502).json({ error: 'Email provider rejected the message', rejected })
    }

    const debug = String(process.env.CONTACT_DEBUG || '').trim().toLowerCase() === 'true'
    res.json(debug ? { ok: true, messageId: info?.messageId, accepted: info?.accepted, rejected: info?.rejected } : { ok: true })
  } catch (err) {
    console.error('POST /v1/contact', err)
    res.status(500).json({ error: err.message || 'Failed to send message' })
  }
})

export default router

