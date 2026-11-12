import { pdfTokens } from '../tokens'
import type { Scale } from './scale'

export const pageTwo = (scale: Scale) =>
  ({
    pageTitle: {
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 6,
    },
    hydrographImage: {
      width: '100%',
      height: 396,
      objectFit: 'contain',
      marginBottom: 8,
      maxWidth: '100%',
    },
    hydrographEmptyState: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: pdfTokens.borderTable,
      padding: 16,
      textAlign: 'center',
      color: pdfTokens.lineColor,
      marginBottom: 12,
    },
    cutMethodBox: {
      borderWidth: 1,
      borderColor: pdfTokens.borderTable,
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
      color: pdfTokens.textSecondary,
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
    cutMethodTable: {
      borderWidth: 1,
      borderColor: pdfTokens.borderSection,
      marginTop: 4,
    },
    cutMethodTableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: pdfTokens.borderSection,
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
      borderRightColor: pdfTokens.borderSection,
    },
    cutMethodTableValueCell: {
      width: '15.6%',
      paddingTop: 4,
      paddingHorizontal: 4,
      paddingBottom: 0,
      borderRightWidth: 1,
      borderRightColor: pdfTokens.borderSection,
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
      borderRightColor: pdfTokens.borderSection,
    },
  }) as const
