import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const layout = (scale: Scale) =>
  ({
    content: {
      flexDirection: 'row',
      gap: 10,
    },
    // ── Column model — lane 33 (Amendment G).  A 60% / 33.33% split with a
    // persistent right-strip for photos.  The 60% side uses flex columns so
    // content flows into the available space naturally. ───────────────────
    columnContainer: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: 2,
    },
    contentColumn: {
      flex: 2,
      flexDirection: 'column',
      minWidth: 0,
    },
    photoColumn: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
      minWidth: 0,
      marginTop: 5,
    },
    rowRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: scale(2, 1.5, 1),
    },
    // ── End column model ──────────────────────────────────────────────────
    leftColumn: {
      width: '57%',
      paddingRight: 2,
    },
    rightColumn: {
      width: '43%',
    },
    blankPageBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    blankPageText: {
      fontSize: 12,
      color: pdfTokens.textPrimary,
      textAlign: 'center',
    },
  }) as const
