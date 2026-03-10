import { IAddress } from '@/interfaces/ocotillo'

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
