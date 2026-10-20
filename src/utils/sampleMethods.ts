import type { ISample } from '@/interfaces/ocotillo'

/**
 * Key a sample's analysis `sample_method` by its id.
 *
 * Returns `{}` when the id is missing or the method is absent, so callers can
 * spread the map straight into `FieldCompilationNotesPdf`; the field sheet then
 * leaves those cells at its `-` placeholder instead of an empty one. A present
 * blank string renders as a single `-`, mirroring the batch exporter's
 * `<Record<number, string>>`.
 */
export const sampleMethodsBySampleId = (
  sample?: Partial<ISample>
): Record<number, string> => {
  const id = typeof sample?.id === 'number' ? sample.id : undefined
  if (!id) return {}
  const method = sample?.sample_method
  return method != null ? { [id]: method.trim() || '-' } : {}
}
