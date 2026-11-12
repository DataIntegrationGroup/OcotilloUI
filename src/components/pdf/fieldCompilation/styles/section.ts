import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const section = (scale: Scale) =>
  ({
    section: {
      marginBottom: scale(9, 7, 5),
    },
    // ── Card-style section wrapper with subtle border and background ────
    sectionCard: {
      borderWidth: 1,
      borderColor: pdfTokens.borderSection,
      borderRadius: 4,
      backgroundColor: pdfTokens.cardSurface,
      padding: 0,
      marginBottom: scale(3, 2, 1),
      width: '100%',
      flexShrink: 0,
    },
    sectionTitleBar: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    accentBar: {
      width: 3,
      borderRadius: 0.5,
      backgroundColor: pdfTokens.accentPrimary,
      marginRight: 5,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      marginBottom: 2,
    },
    noteText: {
      lineHeight: 1.15,
    },
  }) as const
