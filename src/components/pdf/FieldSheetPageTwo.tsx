import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { PageFooter } from '@/components/pdf/layout'
import { PRINT } from '@/components/pdf/printTokens'
import { buildWeaverLocationUrl } from '@/utils/wellPublicUrls'

/**
 * react-pdf ignores `bottom` on an absolutely positioned child of this page
 * (verified 2026-10-21: `bottom: 14` printed nothing, `top` prints), so the
 * footer is anchored from the top. LETTER is 792 pt tall with 28 pt page
 * padding; 762 = 792 - 28 - 2 puts the 9 pt line in the bottom margin band,
 * entirely on-page.
 */
const LETTER_HEIGHT = 792
const PAGE_PADDING = 28
const FOOTER_TOP = LETTER_HEIGHT - PAGE_PADDING - 2

/**
 * Field sheet page 2 — owner leave-behind (BDMS-1507).
 *
 * A single LETTER page printed after the field sheets so a landowner can take
 * it home. Elements render in the spec's order with one accent colour (#1a5276)
 * and no density step: header, well-info grid (optional OSE cell), reserved
 * hydrograph block, manual-measurements table, write-in box, footer, staff line.
 */

export type FieldSheetPageTwoMeasurement = {
  date: string
  dtwFt: number
  mpHeightFt: number
  levelStatus?: string
}

export type FieldSheetPageTwoData = {
  siteName: string
  pointId: string
  wellDepthFt: string
  /** Present only when the well has one; its grid cell is omitted otherwise. */
  oseNumber?: string
  measurements: FieldSheetPageTwoMeasurement[]
  /** Data URL for the QR block; when absent the block keeps its placeholder. */
  qrDataUrl?: string
  staffName: string
  staffEmail: string
  staffPhone: string
}

type Props = FieldSheetPageTwoData

// Palette comes from the shared print tokens (printTokens.ts) so the field
// sheet prints with exactly these values; this page is the design reference.
const accent = PRINT.accent
const secondary = PRINT.secondary
const body = PRINT.body
const panel = PRINT.panel

/** Feet print with two decimals; a measurement of 35.1 is 35.10 on paper. */
const feet = (value: number): string => value.toFixed(2)

/** The printed link, from the one builder; scheme dropped for print. */
const printedLocationUrl = (pointId: string): string =>
  (buildWeaverLocationUrl(pointId) ?? '').replace(/^https?:\/\//, '')

/**
 * `2018 – 2026` style span for the hydrograph caption, from the dates actually
 * printed in the table below it. Empty when there is nothing to span.
 */
const yearRange = (measurements: FieldSheetPageTwoMeasurement[]): string => {
  const years = measurements
    .map((m) => Number(/(\d{4})/.exec(m.date)?.[1]))
    .filter((year) => Number.isFinite(year))
  if (years.length === 0) return ''
  const first = Math.min(...years)
  const last = Math.max(...years)
  return first === last ? `${first}` : `${first} – ${last}`
}

export const FieldSheetPageTwo = ({
  siteName,
  pointId,
  wellDepthFt,
  oseNumber,
  measurements,
  qrDataUrl,
  staffName,
  staffEmail,
  staffPhone,
}: Props) => (
  <Page size="LETTER" style={styles.page}>
    {/* 1. Header */}
    <View style={styles.header}>
      <View style={styles.logoBlock}>
        <Text style={styles.logoLine}>NMBGMR</Text>
        <Text style={styles.logoLine}>Logo</Text>
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>Your Well: {siteName}</Text>
        <Text style={styles.subtitle}>
          Healy Collaborative Groundwater Monitoring Network
        </Text>
      </View>
    </View>

    {/* 2. Well info grid (2 columns; OSE cell omitted when absent) */}
    <View style={styles.grid}>
      <View style={styles.rowGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.cellText}>
            <Text style={styles.label}>Site Name: </Text>
            {`${siteName}`}
          </Text>
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.cellText}>
            <Text style={styles.label}>Point ID: </Text>
            {`${pointId}`}
          </Text>
        </View>
      </View>
      <View style={styles.rowGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.cellText}>
            <Text style={styles.label}>Well Depth: </Text>
            {`${wellDepthFt}`}
          </Text>
        </View>
        {oseNumber ? (
          <View style={styles.infoCell}>
            <Text style={styles.cellText}>
              <Text style={styles.label}>OSE #: </Text>
              {`${oseNumber}`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>

    {/* 3. Hydrograph — the mock-up labels this with the series it will hold;
        the date span comes from the readings printed below it, not a fixed
        range, and nothing at all prints when there are no readings. */}
    <View style={styles.hydrograph}>
      <Text style={styles.hydrographCaption}>
        {`Depth to Water${yearRange(measurements) ? ` · ${yearRange(measurements)}` : ''}`}
      </Text>
    </View>

    {/* 4. Manual measurements table (View rows; react-pdf has no table elements) */}
    <View style={styles.table}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.headCell, styles.dateCell]}>
          Date
        </Text>
        <Text style={[styles.cell, styles.headCell, styles.narrowCell]}>
          DTW (ft)
        </Text>
        <Text style={[styles.cell, styles.headCell, styles.narrowCell]}>
          MP Ht (ft)
        </Text>
        <Text style={[styles.cell, styles.headCell, styles.wideCell]}>
          Level Status
        </Text>
      </View>
      {measurements.map((m, index) => {
        const rowStyle =
          index % 2 === 1 ? [styles.row, styles.zebraRow] : styles.row

        return (
          <View key={m.date} style={rowStyle}>
            <Text style={[styles.cell, styles.dateCell]}>{m.date}</Text>
            <Text style={[styles.cell, styles.narrowCell]}>
              {feet(m.dtwFt)}
            </Text>
            <Text style={[styles.cell, styles.narrowCell]}>
              {feet(m.mpHeightFt)}
            </Text>
            <Text style={[styles.cell, styles.wideCell]}>
              {/* Empty reading status prints an em dash, never a hyphen. */}
              {m.levelStatus || '—'}
            </Text>
          </View>
        )
      })}
    </View>

    {/* 5. Today's measurement (hand-writable write-in) */}
    <View style={styles.measurement}>
      <Text style={styles.measurementTitle}>Today's Measurement</Text>
      <Text style={styles.measurementLead}>
        Your water level measured on this visit:
      </Text>
      <View style={styles.measurementRule}>
        <Text style={styles.ruleLabel}>Date:</Text>
        {/* Owner-facing wording: plain English, not the internal "DTW" tag. */}
        <Text style={styles.ruleLabel}>Depth to water (ft):</Text>
        <Text style={styles.ruleFt}>ft</Text>
      </View>
    </View>

    {/* 6. Footer: QR placeholder + link, contact */}
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        <View style={styles.qrBlock}>
          {qrDataUrl ? (
            <Image src={qrDataUrl} style={styles.qrImage} />
          ) : (
            <Text style={styles.qrCaption}>[QR Code]</Text>
          )}
        </View>
        <View style={styles.linkRow}>
          {/* Plain-English lead-in for the printed link; a printed URL is read, not clicked. */}
          <Text style={styles.linkLabel}>View your well data online: </Text>
          {/* The printed link comes from one builder; the hard-coded host is
              gone. Scheme is dropped because a printed URL is read, not clicked. */}
          <Text style={styles.linkUrl}>{printedLocationUrl(pointId)}</Text>
        </View>
      </View>
      <View style={styles.footerRight}>
        <Text style={styles.contactLead}>For questions:</Text>
        <Text style={styles.contactEmail}>nmbg-waterlevels@nmt.edu</Text>
      </View>
    </View>

    {/* 7. Staff line */}
    <Text style={styles.staffLine}>
      Visited by: {staffName} | {staffEmail} | {staffPhone}
    </Text>

    {/* Footer: `Well ID: <point id> | Page n` (ALIGNMENT A12). */}
    <PageFooter
      wellId={pointId}
      totalPages={2}
      styles={{
        footer: styles.pageFooter,
        footerText: styles.pageFooterText,
      }}
    />
  </Page>
)

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    lineHeight: 1.35,
    color: body,
  },
  // 1. Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: accent,
    paddingBottom: 10,
    marginBottom: 12,
    gap: 12,
  },
  logoBlock: {
    width: 80,
    height: 50,
    backgroundColor: accent,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  logoLine: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 700,
    textAlign: 'center',
  },
  headerText: { flexDirection: 'column' },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: accent,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 9,
    color: secondary,
  },
  // 2. Well info grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 4,
    padding: 10,
    backgroundColor: panel,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: accent,
    marginBottom: 12,
  },
  rowGrid: { flexDirection: 'row' },
  infoCell: { width: '48%' },
  cellText: { fontSize: 10 },
  label: {
    fontWeight: 700,
    color: accent,
    fontSize: 9,
  },
  // 3. Hydrograph reserved block
  hydrograph: {
    height: 200,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrographCaption: {
    color: secondary,
    fontSize: 8,
    textAlign: 'center',
  },
  // 4. Measurements table (widths sum to 100%, collapsed borders)
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  row: { flexDirection: 'row' },
  headerRow: { backgroundColor: accent },
  cell: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    lineHeight: 1.15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    fontSize: 8.5,
    color: body,
  },
  dateCell: { width: '26%' },
  narrowCell: { width: '18%' },
  wideCell: { width: '38%' },
  headCell: {
    fontWeight: 600,
    color: '#fff',
    backgroundColor: accent,
    paddingVertical: 4,
    paddingHorizontal: 8,
    lineHeight: 1.15,
  },
  zebraRow: {
    backgroundColor: panel,
  },
  // 5. Write-in measurement (baseline replaced by flex-end — react-pdf 4 bug)
  measurement: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: accent,
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f0f7ff',
  },
  measurementTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: accent,
  },
  measurementLead: {
    marginTop: 2,
    marginBottom: 6,
    fontSize: 9,
    color: secondary,
  },
  measurementRule: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    borderBottomWidth: 2,
    borderBottomColor: accent,
    height: 28,
  },
  ruleLabel: {
    fontSize: 8,
    color: secondary,
  },
  ruleFt: {
    fontSize: 8,
    color: secondary,
    marginLeft: 'auto',
  },
  // 6. Footer
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: { width: '70%' },
  footerRight: { width: '30%', alignItems: 'flex-end' },
  qrBlock: {
    width: 70,
    height: 70,
    backgroundColor: '#e8e8e8',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCaption: {
    color: '#888',
    fontSize: 7,
    textAlign: 'center',
  },
  qrImage: { width: 68, height: 68, margin: 1 },
  linkRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: 8,
    color: secondary,
  },
  linkLabel: { fontWeight: 700, color: secondary },
  linkUrl: { color: accent, fontSize: 8 },
  contactLead: {
    fontSize: 8.5,
    color: body,
  },
  contactEmail: {
    fontSize: 8.5,
    fontWeight: 700,
    color: accent,
  },
  // 7. Staff line
  staffLine: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    fontSize: 8,
    color: secondary,
  },
  // Anchored from the top — see FOOTER_TOP.
  pageFooter: {
    position: 'absolute',
    top: FOOTER_TOP,
    left: 0,
    right: 0,
  },
  pageFooterText: {
    fontSize: 9,
    color: secondary,
    textAlign: 'center' as const,
  },
})
