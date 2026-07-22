/**
 * Formats a phone number for display.
 * US/Canada: (505) 330-0761 or +1 (505) 330-0761
 * Other lengths: returns as-is
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

/**
 * Formats a partial or complete 10-digit string as the user types.
 * Produces (XXX), (XXX) XXX, or (XXX) XXX-XXXX progressively.
 */
export function formatPhoneDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/**
 * Converts an E.164 phone number (+1XXXXXXXXXX) to display format (XXX) XXX-XXXX.
 */
export function e164ToDisplay(e164: string | undefined | null): string {
  if (!e164) return ''
  const digits = e164.replace(/\D/g, '')
  const local =
    digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return formatPhoneDigits(local)
}

/**
 * Converts a display-formatted phone number to E.164 (+1XXXXXXXXXX).
 * Returns the input unchanged if it does not contain exactly 10 digits.
 */
export function displayToE164(display: string): string {
  const digits = display.replace(/\D/g, '')
  return digits.length === 10 ? `+1${digits}` : display
}

/**
 * Returns true if the display-formatted phone value is either empty or contains
 * exactly 10 digits (a complete US number).
 */
export function isValidPhone(display: string): boolean {
  if (!display.trim()) return true
  return display.replace(/\D/g, '').length === 10
}
