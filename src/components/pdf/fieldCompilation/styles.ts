/**
 * Field Compilation Notes — the field-notes mockup (OcotilloMockups repo,
 * `field-notes-mockup.html`) is the source of truth for type, spacing and
 * colour; this file is its react-pdf translation. Everything is in points
 * against a 612 x 792 page, so the numbers map 1:1 to the mockup's CSS px.
 */
import { Font, StyleSheet } from '@react-pdf/renderer'

// Never hyphenate: the built-in callback splits words, and the sheet's ruled
// fields have no room for broken labels.
Font.registerHyphenationCallback((word) => [word])

// Mockup custom properties (`--ink`, `--band`, ...), resolved to hex because
// react-pdf cannot read CSS variables.
export const FCN_TOKENS = {
  ink: '#0f172a', // --ink
  onband: '#ffffff', // --on-band
  band: '#143d5b', // --band
  head: '#143d5b', // --head
  headrule: '#0f5786', // --head-rule
  rule: '#d6d3d1', // --rule
  zebra: '#f5f5f5', // --zebra
  amber: '#f2e9d2', // --amber
  green: '#dcece7', // --green
  write: '#eeeff0', // --write
  muted: '#64748b', // --muted
  accent: '#0f5786', // --accent
  frame: '#d9dadd', // --frame
  brand50: '#eff8fd', // --brand-50
  destructive: '#dc2626', // --destructive
  paper: '#ffffff', // --paper
} as const

export const FONT = 'Helvetica'
export const FONT_BOLD = 'Helvetica-Bold'

// Page geometry (pt)
export const PAGE_MARGIN = 28
export const CONTENT_WIDTH = 612 - 2 * PAGE_MARGIN // 556
const TOP_COL_GAP = 10
// Mockup `.fn-top` is `minmax(0,1fr) 104pt`: the main column takes the rest of
// the content width and the photo rail is a fixed 104pt track.
export const TOP_PHOTOS_WIDTH = 104
export const TOP_MAIN_WIDTH = CONTENT_WIDTH - TOP_COL_GAP - TOP_PHOTOS_WIDTH // 442

export const RULE_PITCH = 12
export const RULED_LABEL_WIDTH = 74

// Shared type scale: body/label 8.5, table cells 7.5, table headers 7.
const BODY = 8.5
const CELL = 7.5
const TH = 7

export const fcnStyles = StyleSheet.create({
  // ---- sheets ---------------------------------------------------------------
  page: {
    padding: PAGE_MARGIN,
    backgroundColor: FCN_TOKENS.paper,
    fontFamily: FONT,
    fontSize: BODY,
    lineHeight: 1.25,
    color: FCN_TOKENS.ink,
    flexDirection: 'column',
  },
  /** Page-1 wrapper: one field sheet (Mockup `.p1{gap:4pt}`). */
  p1Block: { marginBottom: 4 },
  /** Page-2 wrapper: the owner leave-behind. */
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

  // ---- .top / .fn-main / .photos --------------------------------------------
  top: { flexDirection: 'row' },
  // Mockup `.top .fn-main{gap:4pt}` — the rhythm belongs to the column, not to items.
  fnMain: { width: TOP_MAIN_WIDTH, marginRight: TOP_COL_GAP, flexDirection: 'column', gap: 4 },
  // Mockup `.rf-pair`: two ruled fields side by side, 8 pt gutter.
  rfPair: { flexDirection: 'row' },
  rfPairCellLeft: { flex: 1, paddingRight: 4 },
  rfPairCellRight: { flex: 1, paddingLeft: 4 },

  ident: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.rule,
  },
  // Mockup `.ident-grid`: 3 equal tracks, 8 pt column gap, 2 pt row gap.
  identGrid: { flex: 1, flexDirection: 'column' },
  identRow: { flexDirection: 'row' },
  identCol: { flex: 1 },
  identColGap: { marginRight: 8 },
  identRowGap: { marginBottom: 2 },
  // Mockup `.idqr`: 52 pt square, right of the grid (8 pt gutter).
  idqr: { width: 52, height: 52, marginLeft: 8 },

  contacts: {
    flexDirection: 'row',
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.rule,
  },
  // Mockup `.contacts .ct{gap:1pt}`.
  card: { flex: 1, flexDirection: 'column', gap: 1 },
  cardGap: { marginRight: 8 },
  cardHead: {
    fontFamily: FONT_BOLD,
    fontSize: 7,
    letterSpacing: 0.56,
    textTransform: 'uppercase',
    color: FCN_TOKENS.muted,
    marginBottom: 1,
  },

  ruledField: { flexDirection: 'row', alignItems: 'flex-start' },
  ruledLabel: {
    width: RULED_LABEL_WIDTH,
    fontFamily: FONT_BOLD,
    fontSize: BODY,
    lineHeight: RULE_PITCH / BODY,
  },
  // Ruled text areas: 12 pt pitch, text aligned to the rules.
  ruledArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  ruledText: { fontSize: BODY, lineHeight: RULE_PITCH / BODY },
  ruledLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: FCN_TOKENS.rule,
  },

  // Mockup `.photos{gap:4pt}` / `.photo{gap:2pt}`.
  photos: { width: TOP_PHOTOS_WIDTH, flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  photo: { flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
  photoFrame: {
    width: 104,
    height: 78,
    borderWidth: 0.5,
    borderColor: FCN_TOKENS.frame,
    backgroundColor: FCN_TOKENS.frame,
    overflow: 'hidden',
  },
  photoImage: { width: 104, height: 78, objectFit: 'cover' },
  capCol: { width: 104, flexDirection: 'column' },
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
  preVisitBand: { backgroundColor: FCN_TOKENS.amber },
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
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: FCN_TOKENS.head,
    borderRightWidth: 0.5,
    borderRightColor: FCN_TOKENS.headrule,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.head,
    // Mockup `.tbl .th` left-aligns label headers; only `.th.fn-num` centres.
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  thNum: { alignItems: 'center' },
  thNumText: { textAlign: 'center' },
  thEnd: { borderRightColor: FCN_TOKENS.rule },
  thText: {
    color: FCN_TOKENS.onband,
    fontFamily: FONT_BOLD,
    fontSize: TH,
    lineHeight: 1.2,
    letterSpacing: 0.42,
    textTransform: 'uppercase',
  },
  num: { textAlign: 'center' }, // mockup `.tbl .fn-num{text-align:center}`
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

  // ---- .nm / .nmbox / .wrow / .mgrid ----------------------------------------
  nm: { flexGrow: 1, flexDirection: 'column' },
  nmbox: {
    flexGrow: 1,
    flexDirection: 'column',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: FCN_TOKENS.band,
    paddingTop: 4,
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
  nmItem: { marginBottom: 3.5 },
  prev: { fontFamily: FONT_BOLD, fontSize: BODY, textAlign: 'right', minHeight: 10.6 },
  wrow: { flexDirection: 'row' },
  wcell: { flex: 1, flexDirection: 'column' },
  wcellGap: { marginRight: 8 },
  wLabel: { fontFamily: FONT_BOLD, fontSize: CELL, marginBottom: 1.5 },
  // Mockup `.wbox`: no fill, no box — a bottom rule only. Aligned to the
  // mockup's `.line` height (12pt); both plain and "tall" variants now use it.
  wbox: {
    height: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: FCN_TOKENS.rule,
  },
  wboxTall: { height: 12, borderBottomWidth: 0.5, borderBottomColor: FCN_TOKENS.rule },
  // Mockup `.wf.inl`: bold label, then a 12 pt rule filling the rest of the half.
  wInlineCell: { flexGrow: 1, flexBasis: 0, flexDirection: 'row', alignItems: 'flex-end', height: 10 },
  wInlineLabel: { fontFamily: FONT_BOLD, fontSize: CELL, lineHeight: 9, marginRight: 6 },
  wRule: { flexGrow: 1, flexShrink: 1, flexBasis: 0, height: 0.5, backgroundColor: FCN_TOKENS.rule },
  wInlineGap: { marginRight: 8 },
  // Mockup `.ruled-field`: 74 pt label column beside a 24 pt ruled area.
  gnField: { flexDirection: 'row', marginTop: 2 },
  gnLabel: { width: RULED_LABEL_WIDTH, fontFamily: FONT_BOLD, fontSize: BODY, lineHeight: 12 },
  gnArea: { flexGrow: 1, flexBasis: 0, height: 22, flexDirection: 'column' },
  gnLine: { height: 11, borderBottomWidth: 0.5, borderBottomColor: FCN_TOKENS.rule },

  // Mockup `.mgrid{flex:1; grid-auto-rows:1fr}`: the grid fills the measured
  // box and its eight data rows divide the leftover height equally.
  mgrid: { flexGrow: 1, flexDirection: 'column', borderLeftWidth: 0.5, borderLeftColor: FCN_TOKENS.rule },
  mgridHeadRow: { flexDirection: 'row' },
  mgridRow: { flexDirection: 'row', flexGrow: 1 },
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
    paddingVertical: 1.0,
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
  ask: { flex: 1, alignItems: 'flex-end' },
  askQ: { fontFamily: FONT_BOLD, fontSize: CELL, marginBottom: 2 },
  askLine: { fontSize: 7, color: FCN_TOKENS.muted, lineHeight: 1.2 },
  emails: { flexDirection: 'row', justifyContent: 'space-between' },
  emailText: { fontSize: 7, color: FCN_TOKENS.muted },
})

