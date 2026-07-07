export function cleanText(v, max) {
  if (v == null) return ''
  const s = String(v).trim()
  return s.length > max ? s.slice(0, max) : s
}

export function isValidEmail(email) {
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

export function escapeLt(s) {
  return String(s).replace(/</g, '&lt;')
}
