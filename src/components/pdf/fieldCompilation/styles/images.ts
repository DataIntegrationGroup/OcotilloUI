import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

/**
 * Photo frame height in points. PR #428 item 1 ("make photos smaller"): 140 pt
 * was too tall for the right strip and pushed the last measurement row down.
 * 100 pt keeps three frames plus captions inside the strip.
 */
export const PHOTO_CELL_HEIGHT = 100

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
      height: PHOTO_CELL_HEIGHT,
      objectFit: 'cover',
      borderWidth: 1,
      borderColor: pdfTokens.borderTable,
      borderRadius: 4,
      backgroundColor: pdfTokens.white,
    },
    photoSlotPlaceholder: {
      width: '100%',
      height: PHOTO_CELL_HEIGHT,
      borderWidth: 1,
      borderStyle: 'dashed',
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
