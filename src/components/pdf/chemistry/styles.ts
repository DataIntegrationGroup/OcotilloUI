import { StyleSheet } from '@react-pdf/renderer'

/**
 * Print palette and type scale for the owner-facing chemistry report.
 *
 * No style here sets `lineHeight`. react-pdf 4.4.0 renders any explicit value
 * -- 1.0 and 1.55 alike -- with roughly double the leading it should, which
 * double-spaced every wrapped paragraph in the report. Its default metrics are
 * correct, so leading is left alone.
 *
 * The report is read by well owners, not by staff, so the design does the
 * triage: a navy masthead, teal section rules, and results that carry their own
 * verdict as a tinted row and a status pill rather than a number the reader has
 * to look up. Numeric columns are monospaced so decimal points line up down a
 * column and 0.012 cannot be mistaken for 0.12 at a glance.
 *
 * The PDF has no dark mode, so these are literals rather than variables.
 */
export const CHEM_REPORT_COLORS = {
  navy: '#1c3f66',
  teal: '#1b6d8f',
  foreground: '#16202c',
  muted: '#6b7785',
  faint: '#96a1ad',
  border: '#dfe3e8',
  borderStrong: '#c8ced6',
  zebra: '#f7f9fb',

  danger: '#c0392b',
  dangerTint: '#fdf1f0',
  dangerBorder: '#e8b4ae',

  warning: '#b5651d',
  warningTint: '#fdf6ef',
  warningBorder: '#e8cfae',

  ok: '#2f7a4d',
  okTint: '#f1f8f3',
  okBorder: '#b7d8c2',

  infoTint: '#f0f6fa',
  infoBorder: '#bcd6e5',
} as const

const MONO = 'Courier'

export const chemReportStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: 38,
    paddingBottom: 58,
    paddingHorizontal: 40,
    color: CHEM_REPORT_COLORS.foreground,
    fontSize: 8.5,
  },

  // ---- Masthead -----------------------------------------------------------
  org: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: CHEM_REPORT_COLORS.navy,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  reportTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: CHEM_REPORT_COLORS.navy,
    marginTop: 7,
  },
  reportSubtitle: {
    fontSize: 10,
    color: CHEM_REPORT_COLORS.muted,
    marginTop: 5,
  },
  reportSubtitleStrong: { color: CHEM_REPORT_COLORS.foreground },
  masthead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  mastheadText: { flex: 1, paddingHorizontal: 12 },
  mastheadLogo: { width: 54, height: 41 },
  qrBlock: { alignItems: 'center', width: 62 },
  qrImage: { width: 62, height: 62 },
  qrCaption: {
    fontSize: 6,
    color: CHEM_REPORT_COLORS.muted,
    marginTop: 3,
    textAlign: 'center',
  },
  ownerBlock: { marginTop: 12 },
  ownerName: { fontWeight: 'bold' },
  ownerMeta: { fontSize: 7.5, color: CHEM_REPORT_COLORS.muted, marginTop: 2 },
  mastheadRule: {
    borderBottomWidth: 0.75,
    borderBottomColor: CHEM_REPORT_COLORS.borderStrong,
    marginTop: 14,
    marginBottom: 14,
  },
  lede: { marginBottom: 16 },

  // ---- Section headings ---------------------------------------------------
  section: { marginBottom: 13 },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  sectionHeading: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: CHEM_REPORT_COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionNote: { fontSize: 7.5, color: CHEM_REPORT_COLORS.muted },

  // ---- At a glance --------------------------------------------------------
  statRow: { flexDirection: 'row', gap: 7 },
  stat: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: CHEM_REPORT_COLORS.border,
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 6.5,
    color: CHEM_REPORT_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: { fontSize: 17, fontWeight: 'bold', marginTop: 5 },
  statValueDanger: { color: CHEM_REPORT_COLORS.danger },
  statValueWarning: { color: CHEM_REPORT_COLORS.warning },
  statNote: { fontSize: 7, color: CHEM_REPORT_COLORS.muted, marginTop: 4 },

  // ---- Callouts -----------------------------------------------------------
  callout: {
    borderLeftWidth: 2.5,
    borderLeftColor: CHEM_REPORT_COLORS.danger,
    backgroundColor: CHEM_REPORT_COLORS.dangerTint,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 16,
  },
  calloutWarn: {
    borderLeftColor: CHEM_REPORT_COLORS.warning,
    backgroundColor: CHEM_REPORT_COLORS.warningTint,
  },
  calloutInfo: {
    borderLeftColor: CHEM_REPORT_COLORS.teal,
    backgroundColor: CHEM_REPORT_COLORS.infoTint,
  },
  calloutTitle: { fontWeight: 'bold', marginBottom: 5 },
  calloutBody: {},
  calloutBullet: { marginTop: 4, paddingLeft: 10 },

  // ---- Key/value grid ----------------------------------------------------
  kvTable: {
    borderWidth: 0.75,
    borderColor: CHEM_REPORT_COLORS.border,
    borderRadius: 3,
  },
  kvRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: CHEM_REPORT_COLORS.border,
  },
  kvRowLast: { borderBottomWidth: 0 },
  kvCell: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRightWidth: 0.75,
    borderRightColor: CHEM_REPORT_COLORS.border,
  },
  kvCellLast: { borderRightWidth: 0 },
  kvLabel: {
    fontSize: 6.5,
    color: CHEM_REPORT_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  kvValue: { marginTop: 3 },

  // ---- Tables -------------------------------------------------------------
  table: { marginTop: 2 },
  th: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: CHEM_REPORT_COLORS.borderStrong,
    paddingBottom: 4,
  },
  thText: {
    fontSize: 6.5,
    color: CHEM_REPORT_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: CHEM_REPORT_COLORS.border,
    paddingVertical: 3.5,
  },
  trZebra: { backgroundColor: CHEM_REPORT_COLORS.zebra },
  trDanger: { backgroundColor: CHEM_REPORT_COLORS.dangerTint },
  trWarning: { backgroundColor: CHEM_REPORT_COLORS.warningTint },
  trMuted: { color: CHEM_REPORT_COLORS.faint },
  td: { paddingHorizontal: 4 },
  tdMono: { fontFamily: MONO, fontSize: 8 },
  tdStrong: { fontWeight: 'bold' },
  tdNoStandard: { color: CHEM_REPORT_COLORS.faint },

  // ---- Status pills -------------------------------------------------------
  pill: {
    borderWidth: 0.75,
    borderRadius: 7,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 6.5 },
  pillDanger: {
    borderColor: CHEM_REPORT_COLORS.dangerBorder,
    backgroundColor: '#ffffff',
    color: CHEM_REPORT_COLORS.danger,
  },
  pillWarning: {
    borderColor: CHEM_REPORT_COLORS.warningBorder,
    backgroundColor: '#ffffff',
    color: CHEM_REPORT_COLORS.warning,
  },
  pillOk: {
    borderColor: CHEM_REPORT_COLORS.okBorder,
    backgroundColor: '#ffffff',
    color: CHEM_REPORT_COLORS.ok,
  },
  pillNeutral: {
    borderColor: CHEM_REPORT_COLORS.border,
    backgroundColor: '#ffffff',
    color: CHEM_REPORT_COLORS.muted,
  },
  ndBadge: {
    borderWidth: 0.75,
    borderColor: CHEM_REPORT_COLORS.border,
    borderRadius: 6,
    paddingVertical: 1,
    paddingHorizontal: 3,
    marginLeft: 4,
    fontSize: 6,
    color: CHEM_REPORT_COLORS.muted,
  },

  // ---- Legend and footnotes ----------------------------------------------
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 7,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendSwatch: { width: 7, height: 5, borderRadius: 1 },
  legendText: { fontSize: 6.5, color: CHEM_REPORT_COLORS.muted },
  footnote: {
    fontSize: 7,
    fontStyle: 'italic',
    color: CHEM_REPORT_COLORS.muted,
    marginTop: 7,
  },
  emptyNote: { fontSize: 8, color: CHEM_REPORT_COLORS.muted },

  // ---- Placeholder for a chart the export cannot draw --------------------
  chartSlot: {
    borderWidth: 0.75,
    borderColor: CHEM_REPORT_COLORS.border,
    borderRadius: 3,
    backgroundColor: CHEM_REPORT_COLORS.zebra,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  chartSlotText: {
    fontSize: 7,
    fontStyle: 'italic',
    color: CHEM_REPORT_COLORS.faint,
    textAlign: 'center',
  },

  // ---- Two-column glossary ----------------------------------------------
  glossaryRow: { flexDirection: 'row', gap: 18 },
  glossaryColumn: { flex: 1 },
  glossaryEntry: { marginBottom: 6 },
  glossaryTerm: { fontWeight: 'bold' },

  // ---- Footer -------------------------------------------------------------
  footer: {
    position: 'absolute',
    bottom: 26,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 0.75,
    borderTopColor: CHEM_REPORT_COLORS.border,
    paddingTop: 7,
  },
  footerText: { fontSize: 6.5, color: CHEM_REPORT_COLORS.muted },
  footerContact: {
    fontSize: 6.5,
    color: CHEM_REPORT_COLORS.muted,
  },
})
