/**
 * Normalizes phone numbers to standard 10-digit format.
 * Strips out spaces, dashes, +91 country code, leading zeros.
 */
export function normalizePhone(rawPhone: any): string {
  if (rawPhone === null || rawPhone === undefined) return ''
  const str = String(rawPhone)
  let cleaned = str.replace(/\D/g, '')

  // If 12 digits starting with 91 (India country code)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2)
  }
  // If 11 digits starting with 0
  else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }
  // If more than 10 digits, take the last 10
  else if (cleaned.length > 10) {
    cleaned = cleaned.slice(-10)
  }

  return cleaned
}

export function isValidPhone(phone: any): boolean {
  const normalized = normalizePhone(phone)
  return /^[0-9]{10}$/.test(normalized)
}
