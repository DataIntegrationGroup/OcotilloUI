import { useMemo } from 'react'
import type { IWell } from '@/interfaces/ocotillo'
import { groupNotesByType } from '@/utils'

/**
 * Collects notes from multiple well fields and groups them by type.
 * Returns array of grouped sections, with fallback to empty "Notes" section if nothing found.
 */
export const useAllNotes = (well: IWell | null | undefined) => {
  return useMemo(() => {
    if (!well) {
      return [{ title: 'Notes', value: null }]
    }

    const allNotes = [
      ...(well.water_notes ?? []),
      ...(well.measuring_notes ?? []),
      ...(well.construction_notes ?? []),
      ...(well.general_notes ?? []),
      ...(well.current_location?.properties?.notes ?? []),
      ...(well.sampling_procedure_notes ?? []),
    ].filter(Boolean) // remove any falsy values just in case

    const grouped = groupNotesByType(allNotes, { defaultTitle: 'Notes' })

    // If grouping returned nothing → provide at least one placeholder section
    if (grouped.length === 0) {
      return [{ title: 'Notes', value: null }]
    }

    return grouped
  }, [well])
}
