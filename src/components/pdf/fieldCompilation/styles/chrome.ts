import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const chrome = (scale: Scale) =>
  ({
    page: {
      paddingTop: scale(18, 16, 12),
      paddingBottom: scale(18, 16, 12),
      backgroundColor: pdfTokens.white,
      fontSize: scale(9.5, 9, 8.5),
      color: pdfTokens.textPrimary,
    },
    pageDate: {
      position: 'absolute',
      top: 16,
      right: 20,
      fontSize: scale(9.5, 9, 8.5),
      color: pdfTokens.textPrimary,
    },
    footer: {
      position: 'absolute',
      bottom: scale(12, 10, 8),
      left: scale(22, 20, 14),
      right: scale(22, 20, 14),
    },
    footerText: {
      fontSize: scale(8, 7.5, 7),
      color: pdfTokens.lineColor,
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.borderTable,
      paddingBottom: 6,
    },
    title: {
      fontSize: 15,
      fontWeight: 700,
      textAlign: 'center',
    },
    headerDate: {
      fontSize: 9,
      textAlign: 'right',
      marginTop: 3,
    },
  }) as const
