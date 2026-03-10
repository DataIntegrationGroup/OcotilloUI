export const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  if (!normalized) return undefined

  const parsed = Number(normalized[0])
  return Number.isFinite(parsed) ? parsed : undefined
}
