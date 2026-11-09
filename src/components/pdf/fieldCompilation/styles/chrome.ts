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
    pageFrame: {
      paddingHorizontal: scale(48, 36, 24),
    },
    pageDate: {
      position: 'absolute',
      top: 16,
      right: scale(48, 36, 24),
      fontSize: scale(9.5, 9, 8.5),
      color: pdfTokens.textPrimary,
    },
    footer: {
      position: 'absolute',
      bottom: scale(12, 10, 8),
      left: scale(48, 36, 24),
      right: scale(48, 36, 24),
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
      textAlign: 'left',
    },
    headerDate: {
      fontSize: 9,
      textAlign: 'right',
      marginTop: 3,
    },
  }) as const
