import { IAddress } from '@/interfaces/ocotillo'

/** Single-line comma-separated address for display (e.g. contact cards) */
export const formatContactAddress = (
  addr:
    | {
        address_line_1?: string
        address_line_2?: string | null
        city?: string
        state?: string
        postal_code?: string
        country?: string
      }
    | null
    | undefined
): string => {
  if (!addr) return 'N/A'
  const parts = [
    addr.address_line_1,
    addr.address_line_2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
  ].filter(Boolean)
  return parts.join(', ') || 'N/A'
}

export const formatAddress = (a?: IAddress | null): string => {
  if (!a) return 'N/A'

  const lines: string[] = []

  if (a.address_line_1) lines.push(a.address_line_1)
  if (a.address_line_2) lines.push(a.address_line_2)

  const cityStateZip = [a.city, a.state, a.postal_code]
    .filter(Boolean)
    .join(', ')
  if (cityStateZip) lines.push(cityStateZip)

  if (a.country) lines.push(a.country)

  // React-PDF supports "\n" for multi-line text
  return lines.join('\n')
}
