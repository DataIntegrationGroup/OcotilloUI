import { IThing } from '@/interfaces/ocotillo/IThing'

export const buildPdfFilename = <T extends IThing | undefined>(thing: T) => {
  const nano_uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8)

  const raw = thing?.name?.trim() || String(thing?.id ?? 'REPORT')
  const name = raw.toUpperCase().replace(/\s+/g, '_')

  return `${name}_${nano_uuid}.pdf`
}
