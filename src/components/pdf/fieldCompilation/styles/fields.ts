import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const fields = (scale: Scale) =>
  ({
    topGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 7,
    },
    topGridColumn: {
      flex: 1,
    },
    line: {
      marginBottom: 1,
    },
    label: {
      fontWeight: 700,
    },
    contactsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 3,
    },
    contactColumn: {
      flex: 1,
    },
    contactDetails: {
      marginTop: 3,
    },
  }) as const
