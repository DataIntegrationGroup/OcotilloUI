import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const images = (scale: Scale) =>
  ({
    photoCell: {
      width: '100%',
      marginBottom: 2,
    },
    imageNoteRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 8,
      alignItems: 'stretch',
    },
    imageWrap: {
      width: '100%',
    },
    imageWrapFull: {
      width: '100%',
    },
    image: {
      width: '100%',
      height: 140,
      objectFit: 'cover',
      borderWidth: 1,
      borderColor: pdfTokens.borderTable,
      borderRadius: 4,
      backgroundColor: pdfTokens.white,
    },
    imageLabel: {
      marginTop: 2,
      fontSize: 7,
      color: pdfTokens.textSecondary,
    },
    emptyImageState: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: pdfTokens.borderTable,
      padding: 12,
      textAlign: 'center',
      color: pdfTokens.lineColor,
      fontSize: 9,
    },
  }) as const
