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
      // Indent the rows+columns block (photo strip + all sections/tables) off
      // both page edges so tables read as bordered cards, not edge-to-edge.
      // Padding, not margin: this box is width:'100%', and Yoga adds margins
      // OUTSIDE the width — so margins here would make the box 100% + 96pt and
      // hang the right margin off the page, clipping the photo strip. Padding
      // sits inside the 100%, so both edges inset symmetrically.
      paddingLeft: scale(48, 36, 24),
      paddingRight: scale(48, 36, 24),
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
