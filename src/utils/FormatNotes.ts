type NoteLike = {
  content?: string | null
  note_type?: string | null
}

type NoteSection = {
  title: string
  value: string
}

const normalizeNotes = (notes?: NoteLike[] | NoteLike | null): NoteLike[] => {
  if (!notes) return []
  return Array.isArray(notes) ? notes : [notes]
}

const formatNotes = (
  notes?: NoteLike[] | NoteLike | null
): string | null => {
  const formatted = normalizeNotes(notes)
    .map((note) => {
      const content = note.content?.trim()
      return content || null
    })
    .filter((value): value is string => Boolean(value))

  return formatted.length > 0 ? formatted.join('\n') : null
}

export const groupNotesByType = (
  notes?: NoteLike[] | NoteLike | null,
  options: { defaultTitle?: string } = {}
): NoteSection[] => {
  const defaultTitle = options.defaultTitle ?? 'Notes'
  const grouped = new Map<string, NoteLike[]>()
  const order: string[] = []

  normalizeNotes(notes).forEach((note) => {
    const title = note.note_type?.trim() || defaultTitle
    if (!grouped.has(title)) {
      grouped.set(title, [])
      order.push(title)
    }
    grouped.get(title)?.push(note)
  })

  return order
    .map((title) => {
      const value = formatNotes(grouped.get(title))
      return value ? { title, value } : null
    })
    .filter((section): section is NoteSection => Boolean(section))
}
