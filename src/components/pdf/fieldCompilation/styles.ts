import { Font, StyleSheet } from '@react-pdf/renderer'

/* react-pdf 4.x default font hyphenates mid-word (e.g. "sur-face").
 * Return each word unbroken so text flows like the mockup.          */
Font.registerHyphenationCallback((word) => [word])

/**
 * Field Compilation Notes — print tokens and styles.
 *
 * Source of truth: repos/OcotilloMockups/field-notes-mockup.html (`.p1` / `.p2`
 * rules and the `--fn-*` custom properties). react-pdf has no CSS variables,
 * grid or `gap`, so the resolved token values live in FCN_TOKENS and every
 * `grid-template-columns: repeat(N, 1fr)` becomes a flex row of `flex: 1` cells.
 * Style keys mirror the mockup class names (hdr1, ident, band, tbl, mgrid …).
 *
 * Geometry: US Letter 612 x 792 pt, 28 pt margin on both sheets.
 * Type: built-in Helvetica / Helvetica-Bold only (no Font.register).
 */

// Resolved values of the mockup's :root tokens (color-mix results precomputed).
export const FCN_TOKENS = {
  ink: '#0f172a', //        --fn-ink      = --foreground (slate-900)
  onband: '#ffffff', //     --fn-onband
  band: '#143d5b', //       --fn-band     = --brand-900
  head: '#143d5b', //       --fn-head     = --brand-900
  headrule: '#0f5786', //   --fn-headrule = --primary-dark (brand-700)
  rule: '#d6d3d1', //       --fn-rule     = --divider (stone-300)
  zebra: '#f5f5f5', //      --fn-zebra    = --muted
  amber: '#f2e9d2', //      --fn-amber    = --sand
  green: '#dcece7', //      --fn-green    = success 14% on paper
  write: '#eeeff0', //      --fn-write    = foreground 7% on paper
  muted: '#64748b', //      --fn-muted    = --muted-foreground
  accent: '#0f5786', //     --fn-accent   = --primary-dark
  frame: '#d9dadd', //      --fn-frame    = foreground 16% on paper
  brand50: '#eff8fd', //    --brand-50 (page-2 info band)
  destructive: '#dc2626', // current-reading marker
  paper: '#ffffff',
} as const

/** @deprecated kept for older imports; prefer FCN_TOKENS. */
export const FCN_COLORS = {
  foreground: FCN_TOKENS.ink,
  muted: FCN_TOKENS.muted,
  border: FCN_TOKENS.rule,
  borderLight: FCN_TOKENS.rule,
  rowBg: FCN_TOKENS.zebra,
  white: FCN_TOKENS.paper,
} as const

export const FONT = 'Helvetica'
export const FONT_BOLD = 'Helvetica-Bold'

// Page geometry (pt)
export const PAGE_MARGIN = 28
export const CONTENT_WIDTH = 612 - 2 * PAGE_MARGIN // 556
const TOP_COL_GAP = 10
const TOP_COL = (CONTENT_WIDTH - 2 * TOP_COL_GAP) / 3 // one of three equal grid tracks
export const TOP_MAIN_WIDTH = 2 * TOP_COL + TOP_COL_GAP // .fn-main spans 2 tracks
export const TOP_PHOTOS_WIDTH = TOP_COL

/** Ruled text areas: 12 pt pitch, rule in the last 0.5 pt of each line box. */
export const RULE_PITCH = 12
export const RULED_LABEL_WIDTH = 74

// Shared type scale: body/label 8.5, table cells 7.5, table headers 7.
const BODY = 8.5
const CELL = 7.5
const TH = 7

export const fcnStyles = StyleSheet.create({
  // ---- Sheets ---------------------------------------------------------------
  page: {
    padding: PAGE_MARGIN,
    backgroundColor: FCN_TOKENS.paper,
    fontFamily: FONT,
    fontSize: BODY,
    lineHeight: 1.25,
    color: FCN_TOKENS.ink,
    flexDirection: 'column',
  },
  /** vertical rhythm between page-1 blocks (.p1 gap: 6pt) */
  p1Block: { marginBottom: 6 },
  /** vertical rhythm between page-2 blocks (.p2 gap: 10pt) */
  p2Block: { marginBottom: 10 },

  // ---- shared label/value ---------------------------------------------------
  kv: { flexDirection: 'row', minHeight: 11 },
  k: { fontFamily: FONT_BOLD, marginRight: 3 },
  v: { flex: 1 },

  // ---- .hdr1 ----------------------------------------------------------------
  hdr1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: FCN_TOKENS.ink,
    paddingBottom: 3,
  },
  hdr1Title: { fontFamily: FONT_BOLD, fontSize: 15, letterSpacing: -0.15, lineHeight: 1.1 },
  hdr1Date: { fontSize: BODY, color: FCN_TOKENS.muted, paddingBottom: 1.5 },

  // ---- .top / .fn-main / .photos -------------------------------------------
  top: { flexDirection: 'row' },
  fnMain: { width: TOP_MAIN_WIDTH, marginRight: TOP_COL_GAP, flexDirection: 'column' },
  fnMainItem: { marginBottom: 6 },

  ident: {
    flexDirection: 'row',
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.rule,
  },
  identCol: { flex: 1 },
  identColGap: { marginRight: 8 },
  identRowGap: { marginBottom: 2 },

  contacts: {
    flexDirection: 'row',
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.rule,
  },
  card: { flex: 1, flexDirection: 'column' },
  cardGap: { marginRight: 8 },
  cardHead: {
    fontFamily: FONT_BOLD,
    fontSize: 7,
    letterSpacing: 0.56,
    textTransform: 'uppercase',
    color: FCN_TOKENS.muted,
    marginBottom: 2.5,
  },
  cardRow: { marginBottom: 1.5 },

  ruledField: { flexDirection: 'row', alignItems: 'flex-start' },
  ruledLabel: {
    width: RULED_LABEL_WIDTH,
    fontFamily: FONT_BOLD,
    fontSize: BODY,
    lineHeight: RULE_PITCH / BODY,
  },
  ruledArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  ruledText: { fontSize: BODY, lineHeight: RULE_PITCH / BODY },
  ruledLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: FCN_TOKENS.rule,
  },

  photos: { width: TOP_PHOTOS_WIDTH, flexDirection: 'column' },
  photo: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  photoFrame: {
    width: 104,
    height: 78,
    borderWidth: 0.5,
    borderColor: FCN_TOKENS.frame,
    backgroundColor: FCN_TOKENS.frame,
    marginRight: 5,
    overflow: 'hidden',
  },
  photoImage: { width: 104, height: 78, objectFit: 'cover' },
  capCol: { flex: 1, height: 78, flexDirection: 'column', justifyContent: 'flex-end' },
  cap: { fontSize: 7, lineHeight: 1.3, color: FCN_TOKENS.muted },
  capName: { fontFamily: FONT_BOLD, fontSize: 7, lineHeight: 1.3, color: FCN_TOKENS.ink },
  stackcap: { fontSize: 7, color: FCN_TOKENS.muted, marginTop: 1 },

  // ---- .sect / .band / .tbl -------------------------------------------------
  sect: { flexDirection: 'column' },
  band: {
    backgroundColor: FCN_TOKENS.band,
    color: FCN_TOKENS.onband,
    fontFamily: FONT_BOLD,
    fontSize: 8,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    paddingVertical: 2.5,
    paddingHorizontal: 5,
  },
  tbl: { flexDirection: 'column', borderLeftWidth: 0.5, borderLeftColor: FCN_TOKENS.rule },
  tblRow: { flexDirection: 'row' },
  td: {
    flex: 1,
    minHeight: 13,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: FCN_TOKENS.rule,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.rule,
  },
  tdText: { fontSize: CELL, lineHeight: 1.2 },
  th: {
    flex: 1,
    minHeight: 13,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    backgroundColor: FCN_TOKENS.head,
    borderRightWidth: 0.5,
    borderRightColor: FCN_TOKENS.headrule,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.head,
    justifyContent: 'flex-end',
  },
  thEnd: { borderRightColor: FCN_TOKENS.rule },
  thText: {
    color: FCN_TOKENS.onband,
    fontFamily: FONT_BOLD,
    fontSize: TH,
    lineHeight: 1.2,
    letterSpacing: 0.42,
    textTransform: 'uppercase',
  },
  num: { textAlign: 'right' },
  z: { backgroundColor: FCN_TOKENS.zebra },
  stat: { backgroundColor: FCN_TOKENS.amber },
  note: { backgroundColor: FCN_TOKENS.green },

  // ---- .sitenotes -----------------------------------------------------------
  sitenotes: {
    flexDirection: 'row',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: FCN_TOKENS.rule,
  },
  sitenotesK: {
    width: RULED_LABEL_WIDTH,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: FCN_TOKENS.rule,
  },
  sitenotesKText: { fontFamily: FONT_BOLD, fontSize: BODY },
  sitenotesV: {
    flex: 1,
    minHeight: 26,
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: FCN_TOKENS.green,
  },

  // ---- .nm / .nmbox / .wrow / .mgrid ---------------------------------------
  nm: { flexGrow: 1, flexDirection: 'column' },
  nmbox: {
    flexGrow: 1,
    flexDirection: 'column',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: FCN_TOKENS.band,
    paddingTop: 5,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  nmItem: { marginBottom: 5 },
  prev: { fontFamily: FONT_BOLD, fontSize: BODY, textAlign: 'right', minHeight: 10.6 },
  wrow: { flexDirection: 'row' },
  wcell: { flex: 1, flexDirection: 'column' },
  wcellGap: { marginRight: 8 },
  wLabel: { fontFamily: FONT_BOLD, fontSize: CELL, marginBottom: 1.5 },
  wbox: {
    height: 17,
    backgroundColor: FCN_TOKENS.write,
    borderWidth: 0.5,
    borderColor: FCN_TOKENS.rule,
  },
  wboxTall: { height: 28 },

  mgrid: { flexGrow: 1, flexDirection: 'column', borderLeftWidth: 0.5, borderLeftColor: FCN_TOKENS.rule },
  mgridHeadRow: { flexDirection: 'row' },
  mgridRow: { flexDirection: 'row', flexGrow: 1, flexBasis: 0 },
  mgridTh: {
    flex: 1,
    minHeight: 13,
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: FCN_TOKENS.head,
    borderRightWidth: 0.5,
    borderRightColor: FCN_TOKENS.headrule,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.head,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mgridCell: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRightWidth: 0.5,
    borderRightColor: FCN_TOKENS.rule,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.rule,
    justifyContent: 'center',
  },
  mgridRl: { backgroundColor: FCN_TOKENS.zebra },
  mgridRlCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  mgridRlText: { fontFamily: FONT_BOLD, fontSize: CELL },
  mgridW: { backgroundColor: FCN_TOKENS.write },

  // ---- page 2: .hdr2 / .fn-info / .hydbox / .foot ---------------------------
  hdr2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 9,
    borderBottomWidth: 3,
    borderBottomColor: FCN_TOKENS.accent,
  },
  hdr2Logo: { marginRight: 12 },
  hdr2Title: { fontFamily: FONT_BOLD, fontSize: 17, lineHeight: 1.1, color: FCN_TOKENS.accent },
  hdr2Sub: { fontSize: BODY, color: FCN_TOKENS.muted, marginTop: 2 },

  fnInfo: {
    flexDirection: 'column',
    backgroundColor: FCN_TOKENS.brand50,
    borderLeftWidth: 3,
    borderLeftColor: FCN_TOKENS.accent,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  fnInfoRow: { flexDirection: 'row' },
  fnInfoRowGap: { marginBottom: 5 },
  fnInfoKv: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  fnInfoKvGap: { marginRight: 10 },
  fnInfoK: { fontFamily: FONT_BOLD, fontSize: BODY, lineHeight: 1, color: FCN_TOKENS.accent, marginRight: 3 },
  fnInfoV: { fontSize: 10, lineHeight: 1 },

  hydbox: { borderWidth: 0.5, borderColor: FCN_TOKENS.rule, flexDirection: 'column' },
  hydTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 9.5,
    paddingTop: 5,
    paddingHorizontal: 8,
    paddingBottom: 2,
  },
  hydImage: { width: CONTENT_WIDTH - 1, height: 274, objectFit: 'contain' },
  hydEmpty: { width: CONTENT_WIDTH - 1, height: 274 },

  foot: {
    marginTop: 'auto',
    borderTopWidth: 0.5,
    borderTopColor: FCN_TOKENS.rule,
    paddingTop: 8,
    flexDirection: 'column',
  },
  footR1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  qrblk: { flexDirection: 'column' },
  qrLead: { fontFamily: FONT_BOLD, fontSize: CELL, marginBottom: 3 },
  qrImage: { width: 70, height: 70, marginBottom: 3 },
  qrPlaceholder: {
    width: 70,
    height: 70,
    marginBottom: 3,
    borderWidth: 0.5,
    borderColor: FCN_TOKENS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrUrl: { fontSize: CELL, color: FCN_TOKENS.accent },
  ask: { flexDirection: 'column', alignItems: 'flex-end' },
  askQ: { fontFamily: FONT_BOLD, fontSize: 10, marginBottom: 3.5 },
  askLine: { fontSize: BODY, textAlign: 'right', marginBottom: 1.5 },
  emails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: FCN_TOKENS.rule,
    paddingTop: 5,
  },
  emailText: { fontFamily: FONT_BOLD, fontSize: BODY, color: FCN_TOKENS.accent },
})
