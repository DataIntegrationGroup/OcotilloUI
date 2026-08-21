import { StyleSheet } from '@react-pdf/renderer'

/**
 * Print palette for the owner-facing chemistry report. Values mirror the
 * light-mode tokens in the OcotilloMockups design system; the PDF has no dark
 * mode, so they are literals rather than variables.
 */
export const CHEM_REPORT_COLORS = {
  primary: '#0e6da8',
  foreground: '#0f172a',
  muted: '#64748b',
  border: '#e5e5e5',
  destructive: '#dc2626',
  warningText: '#c2410c',
  wrapper: '#fafafa',
} as const

export const chemReportStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: 32,
    paddingBottom: 44,
    paddingHorizontal: 36,
    color: CHEM_REPORT_COLORS.foreground,
  },

  masthead: {
    borderBottomWidth: 2,
    borderBottomColor: CHEM_REPORT_COLORS.primary,
    paddingBottom: 10,
    marginBottom: 14,
  },
  org: {
    fontSize: 8,
    color: CHEM_REPORT_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CHEM_REPORT_COLORS.primary,
    marginTop: 4,
  },
  reportSubtitle: { fontSize: 10, marginTop: 3 },
  ownerBlock: { fontSize: 9, marginTop: 8, lineHeight: 1.4 },
  dim: { color: CHEM_REPORT_COLORS.muted },

  lede: { fontSize: 9, lineHeight: 1.5, marginBottom: 12 },

  section: { marginBottom: 12 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: CHEM_REPORT_COLORS.border,
    paddingBottom: 3,
    marginBottom: 6,
  },

  statRow: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: {
    width: '25%',
    paddingRight: 8,
    marginBottom: 4,
  },
  statLabel: { fontSize: 7.5, color: CHEM_REPORT_COLORS.muted },
  statValue: { fontSize: 15, fontWeight: 'bold', marginTop: 1 },
  statNote: { fontSize: 7.5, color: CHEM_REPORT_COLORS.muted },

  callout: {
    borderWidth: 1,
    borderColor: CHEM_REPORT_COLORS.destructive,
    borderLeftWidth: 3,
    backgroundColor: '#fef2f2',
    padding: 8,
    marginBottom: 8,
  },
  calloutWarn: {
    borderColor: CHEM_REPORT_COLORS.warningText,
    backgroundColor: '#fff7ed',
  },
  calloutTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    color: CHEM_REPORT_COLORS.destructive,
  },
  calloutTitleWarn: { color: CHEM_REPORT_COLORS.warningText },
  calloutBody: { fontSize: 8.5, lineHeight: 1.45 },

  kvRow: { flexDirection: 'row', flexWrap: 'wrap' },
  kvCell: { width: '33.33%', paddingRight: 8, marginBottom: 5 },
  kvLabel: { fontSize: 7.5, color: CHEM_REPORT_COLORS.muted },
  kvValue: { fontSize: 9 },

  table: { borderWidth: 1, borderColor: CHEM_REPORT_COLORS.border },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: CHEM_REPORT_COLORS.wrapper,
    borderBottomWidth: 1,
    borderBottomColor: CHEM_REPORT_COLORS.border,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: CHEM_REPORT_COLORS.border,
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  th: { fontSize: 7.5, fontWeight: 'bold' },
  td: { fontSize: 8 },
  tdExceeds: { color: CHEM_REPORT_COLORS.destructive, fontWeight: 'bold' },
  tdSecondary: { color: CHEM_REPORT_COLORS.warningText, fontWeight: 'bold' },

  // Right-aligned numeric columns carry their own gutter so a long result or
  // limit never butts up against the unit or status that follows it.
  colParameter: { flex: 3, paddingRight: 6 },
  colValue: { flex: 1.6, textAlign: 'right', paddingRight: 8 },
  colUnit: { flex: 1.2, paddingRight: 6 },
  colStandard: { flex: 1.8, textAlign: 'right', paddingRight: 8 },
  colStatus: { flex: 1.8, paddingRight: 6 },
  colDate: { flex: 1.8 },

  bullet: { fontSize: 8.5, lineHeight: 1.45, marginBottom: 2 },
  emptyNote: {
    fontSize: 9,
    color: CHEM_REPORT_COLORS.muted,
    fontStyle: 'italic',
    marginBottom: 8,
  },

  footer: {
    position: 'absolute',
    bottom: 22,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: CHEM_REPORT_COLORS.border,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: CHEM_REPORT_COLORS.muted },
})
