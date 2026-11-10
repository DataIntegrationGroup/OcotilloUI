import { StyleSheet } from '@react-pdf/renderer'
import { IPdfDensity } from '@/interfaces'

export const createPdfStyles = (density: IPdfDensity = 'comfortable') => {
  // L9 narrowing: only 'comfortable' density remains, so scale is the
  // non-dense value for every field. `density` is accepted for signature
  // compatibility with callers (well.tsx) and is now always 'comfortable'.
  const scale = (_n: number, _d: number = 0, _vd: number = 0) => _n

  return StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      padding: scale(20),
    },
    title: {
      fontSize: scale(20),
      paddingBottom: scale(25),
      fontWeight: 'bold',
      textAlign: 'center',
    },
    section: { marginBottom: scale(10) },
    subSection: { marginLeft: scale(16), marginBottom: 0 },
    twoByTwoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: scale(10),
    },
    cell3: {
      width: '32%',
      marginBottom: scale(2),
    },
    cell3Span2: {
      width: '66%',
      marginBottom: scale(2),
    },
    cell2: {
      width: '48%',
      marginBottom: scale(2),
    },
    label: { fontSize: scale(12), fontWeight: 'bold' },
    value: { fontSize: scale(12), marginBottom: scale(5) },
    img: {
      width: scale(175),
      height: 'auto',
      margin: scale(4),
      objectFit: 'contain',
      alignSelf: 'flex-start',
    },
    imgLabel: { fontSize: scale(10), margin: scale(4) },
    pageNote: {
      fontSize: scale(12),
      marginBottom: 5,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: scale(20),
      left: 40,
      right: 40,
      textAlign: 'center',
    },
    footerText: { fontSize: scale(9.5), color: '#777' },
    // ── Column model — lane 33 (Amendment G).  A 60% / 33.33% split with a
    // persistent right-strip for photos.  The 60% side uses flex columns so
    // content flows into the available space naturally. ───────────────────
    columnContainer: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
    },
    contentColumn: {
      width: '60%',
    },
    photoColumn: {
      width: '33.33%',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    rowRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: scale(2),
    },
    photoCell: {
      width: '100%',
      marginBottom: scale(4),
    },
    // ── End column model ──────────────────────────────────────────────────
    table: {
      marginTop: scale(8),
      marginBottom: scale(8),
      borderWidth: 1,
      borderColor: '#ddd',
    },
    tableRowHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderColor: '#ddd',
      padding: scale(6),
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderColor: '#eee',
      padding: scale(6),
    },
    tableCellHeader: {
      flex: 1,
      fontSize: scale(8.5),
      fontWeight: 700,
    },
    tableCell: {
      flex: 1,
      fontSize: scale(8.5),
    },
  })
}
