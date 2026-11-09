import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const writeIn = (scale: Scale) =>
  ({
    notePad: {
      width: '50%',
      borderWidth: 1,
      borderColor: pdfTokens.borderSection,
      backgroundColor: pdfTokens.white,
    },
    notePadLine: {
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.bgHeader,
      height: 6,
    },
    preVisitPad: {
      width: '100%',
      paddingTop: scale(3, 2, 1),
      paddingBottom: scale(3, 2, 1),
      paddingLeft: scale(3, 2, 1),
      paddingRight: scale(3, 2, 1),
    },
    ruledSlot: {
      borderWidth: 1,
      borderColor: pdfTokens.borderSection,
      marginBottom: 4,
    },
    // Shorter write-in line so the box stays compact on page 1 (BDMS-1504).
    fillLine: {
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.lineColor,
      height: 16,
    },
    // Stack for the three Notes fill lines (PR #428 item 13): keep the three
    // lines at the same left/right edges as the single existing one and put
    // a 1 pt gap between them so they read as separate write rows.
    notesLineStack: {
      gap: 1,
    },
    notesPad: {
      borderWidth: 1,
      borderColor: pdfTokens.borderTable,
      paddingTop: 2,
    },
    notesPadLine: {
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.borderSection,
      height: 20,
    },
  }) as const
