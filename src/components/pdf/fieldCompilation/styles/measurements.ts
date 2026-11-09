import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const measurements = (scale: Scale) =>
  ({
    newMeasurementBox: {
      borderWidth: 1,
      borderColor: pdfTokens.borderTable,
      padding: scale(3, 3, 2),
      marginBottom: scale(4, 3, 2),
    },
    newMeasurementHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // Extra bottom gap (was 1) so the Previous DTW label that now sits on its
      // own line stays >=10pt below the box title, clear of it and above the
      // Date/Time row at every photo width. Tuned against pr428 gate.
      marginBottom: 3,
    },
    newMeasurementTitle: {
      fontSize: 9,
      fontWeight: 700,
    },
    newMeasurementPrev: {
      fontSize: 8.5,
      fontWeight: 700,
      color: pdfTokens.textPrimary,
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
    newWriteLine: {
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.lineColor,
      height: 7,
    },
    // Thin hairline grid used only for the new write-in measurement grid. Keeps
    // row/column separation without the heavy per-cell padding of cutMethod*.
    newGridRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.borderSection,
    },
    newGridHeaderCell: {
      width: '20%',
      paddingVertical: 2,
      paddingHorizontal: 3,
      fontSize: 7.5,
      fontWeight: 700,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: pdfTokens.borderSection,
    },
    newGridLabelCell: {
      width: '20%',
      paddingVertical: 1,
      paddingHorizontal: 3,
      fontSize: 7,
      fontWeight: 700,
      borderRightWidth: 1,
      borderRightColor: pdfTokens.borderSection,
    },
    newGridValueCell: {
      width: '20%',
      paddingTop: 1,
      paddingBottom: 0,
      paddingHorizontal: 2,
      borderRightWidth: 1,
      borderRightColor: pdfTokens.borderSection,
    },
  }) as const
