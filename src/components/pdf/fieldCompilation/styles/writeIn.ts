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
