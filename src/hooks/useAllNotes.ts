import { useMemo } from 'react'
import type { IWell } from '@/interfaces/ocotillo'
import { groupNotesByType } from '@/utils'
import { IPdfOptions } from '@/interfaces'

/**
 * Collects notes from multiple well fields and groups them by type.
 * Returns array of grouped sections, with fallback to empty "Notes" section if nothing found.
 */
export const useAllNotes = (
  well: IWell | null | undefined,
  options: IPdfOptions = {}
) => {
  return useMemo(() => {
    if (!well) {
      return [{ title: 'Notes', value: null }]
    }

    const noteSources = [
      {
        notes: well.current_location?.properties?.notes
          ?.filter((note) => note.note_type === 'General')
          .map((note) => ({
            ...note,
            note_type: 'Location',
          })),
        include: true,
      },
      { notes: well.water_notes, include: true },
      { notes: well.measuring_notes, include: true },
      {
        notes: well.construction_notes,
        include: options.includeConstructionNotes !== false,
      },
      { notes: well.general_notes, include: true },
      { notes: well.sampling_procedure_notes, include: true },
    ]

    const allNotes = noteSources
      .filter((source) => source.include)
      .flatMap((source) => source.notes ?? [])
      .filter(Boolean)

    const grouped = groupNotesByType(allNotes, { defaultTitle: 'Notes' })

    // If grouping returned nothing → provide at least one placeholder section
    if (grouped.length === 0) {
      return [{ title: 'Notes', value: null }]
    }

    return grouped
  }, [well, options.includeConstructionNotes])
}
