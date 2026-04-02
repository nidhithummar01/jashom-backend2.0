import { Router } from 'express'
import nodemailer from 'nodemailer'

const router = Router()

const SENDGRID_QUEUED_RE = /queued as\s+<?([^>\s]+)>?/i

function isValidEmail(email) {
  if (typeof email !== 'string') return false
  const e = email.trim()
  if (e.length < 5 || e.length > 254) return false
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

/** @returns false if response was sent with 400 */
function validateContactInput(res, fullName, email, message) {
  if (!fullName) {
    res.status(400).json({ error: 'Name is required' })
    return false
  }
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: 'Valid email is required' })
    return false
  }
  if (!message) {
    res.status(400).json({ error: 'Message is required' })
    return false
  }
  return true
}

function escapeLt(s) {
  return String(s).replace(/</g, '&lt;')
}

function buildContactMessageBody(fields, req) {
  const { fullName, email, phone, company, message } = fields
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
        <p style="margin:0 0 6px"><b>Name:</b> ${escapeLt(fullName)}</p>
        <p style="margin:0 0 6px"><b>Email:</b> ${escapeLt(email)}</p>
        ${phone ? `<p style="margin:0 0 6px"><b>Phone:</b> ${escapeLt(phone)}</p>` : ''}
        ${company ? `<p style="margin:0 0 6px"><b>Company:</b> ${escapeLt(company)}</p>` : ''}
        <p style="margin:16px 0 6px"><b>Message:</b></p>
        <pre style="margin:0;padding:12px;background:#f6f7f8;border-radius:8px;white-space:pre-wrap">${escapeLt(message)}</pre>
      </div>
    `.trim()

  return { subject, text, html }
}

function parseSendGridQueuedId(providerResponse) {
  const exec = SENDGRID_QUEUED_RE.exec(String(providerResponse || ''))
  return exec ? exec[1] : null
}

/** @returns true if 502 was sent */
function respondIfSmtpRejected(res, info) {
  const rejected = Array.isArray(info?.rejected) ? info.rejected : []
  if (rejected.length > 0) {
    res.status(502).json({ error: 'Email provider rejected the message', rejected })
    return true
  }
  const accepted = Array.isArray(info?.accepted) ? info.accepted : []
  if (accepted.length === 0) {
    res.status(502).json({ error: 'Email provider did not accept the message' })
    return true
  }
  return false
}

function respondContactSuccess(res, info, providerResponse) {
  const queuedId = parseSendGridQueuedId(providerResponse)
  const rejected = Array.isArray(info?.rejected) ? info.rejected : []
  const accepted = Array.isArray(info?.accepted) ? info.accepted : []
  const debug = String(process.env.CONTACT_DEBUG || '').trim().toLowerCase() === 'true'
  const base = {
    ok: true,
    messageId: info?.messageId,
    queuedId,
    accepted,
    rejected,
  }
  res.json(debug ? { ...base, response: providerResponse } : base)
}

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const fields = {
      fullName: cleanText(body.fullName, 120),
      email: cleanText(body.email, 254),
      phone: cleanText(body.phone, 40),
      company: cleanText(body.company, 160),
      message: cleanText(body.message, 5000),
    }

    if (!validateContactInput(res, fields.fullName, fields.email, fields.message)) return

    const host = mustEnv('SMTP_HOST')
    const port = Number(mustEnv('SMTP_PORT'))
    const user = mustEnv('SMTP_USER')
    const pass = mustEnv('SMTP_PASS')
    const to = optionalEnv('CONTACT_TO_EMAIL', 'info@jashom.com')
    const configuredFrom = optionalEnv('CONTACT_FROM_EMAIL', '')
    const from = isValidEmail(configuredFrom) ? configuredFrom : to

    console.log('contact form: sending to', to, 'from', fields.email, 'name', fields.fullName)
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const { subject, text, html } = buildContactMessageBody(fields, req)

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      replyTo: fields.email,
    })

    const providerResponse = String(info?.response || '')
    const queuedId = parseSendGridQueuedId(providerResponse)
    console.log('contact mail sent', {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: providerResponse,
      queuedId,
    })

    if (respondIfSmtpRejected(res, info)) return
    respondContactSuccess(res, info, providerResponse)
  } catch (err) {
    console.error('POST /v1/contact', err)
    res.status(500).json({ error: err.message || 'Failed to send message' })
  }
})

export default router
