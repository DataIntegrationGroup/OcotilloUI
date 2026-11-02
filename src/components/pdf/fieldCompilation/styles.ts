import { StyleSheet } from '@react-pdf/renderer'
import type { IPdfDensity } from '@/interfaces'
import { scaleForDensity } from './density'

export type FieldCompilationStyles = ReturnType<
  typeof createFieldCompilationStyles
>

export const createFieldCompilationStyles = (
  density: IPdfDensity = 'standard'
) => {
  const scale = (c: number, st: number, k: number) =>
    scaleForDensity(c, st, k, density)

  return StyleSheet.create({
    page: {
      paddingTop: scale(18, 16, 12),
      paddingBottom: scale(18, 16, 12),
      backgroundColor: '#ffffff',
      fontSize: scale(9.5, 9, 8.5),
      color: '#111827',
    },
    pageDate: {
      position: 'absolute',
      top: 16,
      right: 20,
      fontSize: scale(9.5, 9, 8.5),
      color: '#111827',
    },
    footer: {
      position: 'absolute',
      bottom: scale(12, 10, 8),
      left: scale(22, 20, 14),
      right: scale(22, 20, 14),
    },
    footerText: {
      fontSize: scale(8, 7.5, 7),
      color: '#6b7280',
    },
    header: {
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
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
    photoCell: {
      width: '100%',
      marginBottom: 2,
    },
    // ── End column model ──────────────────────────────────────────────────
    leftColumn: {
      width: '57%',
      paddingRight: 2,
    },
    rightColumn: {
      width: '43%',
    },
    section: {
      marginBottom: scale(9, 7, 5),
    },
    // ── Card-style section wrapper with subtle border and background ────
    sectionCard: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
      backgroundColor: '#fafafa',
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
      backgroundColor: '#10b981',
      marginRight: 5,
    },
    topGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 7,
    },
    topGridColumn: {
      flex: 1,
    },
    line: {
      marginBottom: 1,
    },
    label: {
      fontWeight: 700,
    },
    contactsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 3,
    },
    contactColumn: {
      flex: 1,
    },
    contactDetails: {
      marginTop: 3,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      marginBottom: 2,
    },
    noteText: {
      lineHeight: 1.15,
    },
    metricRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    metricCell: {
      flex: 1,
    },
    table: {
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f3f4f6',
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    cell: {
      paddingVertical: 3,
      paddingHorizontal: 3,
      fontSize: 9,
      lineHeight: 1.1,
    },
    cellHeader: {
      fontWeight: 700,
      fontSize: 9,
      paddingVertical: 3,
      paddingHorizontal: 3,
    },
    compactCell: {
      fontSize: 7.5,
      lineHeight: 1.05,
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    compactCellHeader: {
      fontSize: 7.5,
      paddingVertical: 2,
      paddingHorizontal: 2,
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
      borderColor: '#d1d5db',
      borderRadius: 4,
      backgroundColor: '#ffffff',
    },
    imageLabel: {
      marginTop: 2,
      fontSize: 7,
      color: '#4b5563',
    },
    notePad: {
      width: '50%',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: '#ffffff',
    },
    notePadLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
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
      borderColor: '#e5e7eb',
      marginBottom: 4,
    },
    emptyImageState: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#d1d5db',
      padding: 12,
      textAlign: 'center',
      color: '#6b7280',
      fontSize: 9,
    },
    pageTitle: {
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 6,
    },
    hydrographImage: {
      width: '100%',
      height: 250,
      objectFit: 'contain',
      marginBottom: 8,
      maxWidth: '100%',
    },
    hydrographEmptyState: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#d1d5db',
      padding: 16,
      textAlign: 'center',
      color: '#6b7280',
      marginBottom: 12,
    },
    cutMethodBox: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      padding: 10,
      marginBottom: 12,
    },
    cutMethodEquation: {
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 8,
    },
    cutMethodHint: {
      fontSize: 8,
      color: '#4b5563',
      marginBottom: 8,
      lineHeight: 1.2,
    },
    cutMethodRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    cutMethodField: {
      flex: 1,
    },
    cutMethodLabel: {
      fontSize: 8,
      fontWeight: 700,
      marginBottom: 3,
    },
    fillLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#6b7280',
      height: 16,
    },
    cutMethodTable: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      marginTop: 4,
    },
    cutMethodTableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    cutMethodTableRowLast: {
      borderBottomWidth: 0,
    },
    cutMethodTableLabelCell: {
      width: '22%',
      paddingVertical: 6,
      paddingHorizontal: 6,
      fontSize: 8,
      fontWeight: 700,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    cutMethodTableValueCell: {
      width: '15.6%',
      paddingTop: 4,
      paddingHorizontal: 4,
      paddingBottom: 0,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    cutMethodTableValueCellLast: {
      borderRightWidth: 0,
    },
    cutMethodTableHeaderCell: {
      width: '15.6%',
      paddingVertical: 5,
      paddingHorizontal: 4,
      fontSize: 8,
      fontWeight: 700,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    newMeasurementBox: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      padding: scale(3, 3, 2),
      marginBottom: scale(4, 3, 2),
    },
    newMeasurementHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 1,
    },
    newMeasurementTitle: {
      fontSize: 9,
      fontWeight: 700,
    },
    newMeasurementPrev: {
      fontSize: 8.5,
      fontWeight: 700,
      color: '#111827',
    },
    newMeasurementFieldRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 1,
    },
    newMeasurementField: {
      flex: 1,
    },
    newMeasurementFieldLabel: {
      fontSize: 7.5,
      fontWeight: 700,
      marginBottom: 0,
    },
    // Shorter write-in line so the box stays compact on page 1 (BDMS-1504).
    newWriteLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#6b7280',
      height: 7,
    },
    // Thin hairline grid used only for the new write-in measurement grid. Keeps
    // row/column separation without the heavy per-cell padding of cutMethod*.
    newGridRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    newGridHeaderCell: {
      width: '20%',
      paddingVertical: 2,
      paddingHorizontal: 3,
      fontSize: 7.5,
      fontWeight: 700,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    newGridLabelCell: {
      width: '20%',
      paddingVertical: 1,
      paddingHorizontal: 3,
      fontSize: 7,
      fontWeight: 700,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    newGridValueCell: {
      width: '20%',
      paddingTop: 1,
      paddingBottom: 0,
      paddingHorizontal: 2,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    notesPad: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      paddingTop: 2,
    },
    notesPadLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      height: 20,
    },
    blankPageBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    blankPageText: {
      fontSize: 12,
      color: '#111827',
      textAlign: 'center',
    },
  })
}
