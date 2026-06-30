/**
 * Returns true if the email value is either empty or matches a valid email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
