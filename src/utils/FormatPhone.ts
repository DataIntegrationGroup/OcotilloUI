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
