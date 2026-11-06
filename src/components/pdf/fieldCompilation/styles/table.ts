import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const table = (scale: Scale) =>
  ({
    table: {
      borderWidth: 1,
      borderColor: pdfTokens.borderTable,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: pdfTokens.bgHeader,
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.borderTable,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.borderSection,
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
    metricRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    metricCell: {
      flex: 1,
    },
  }) as const
