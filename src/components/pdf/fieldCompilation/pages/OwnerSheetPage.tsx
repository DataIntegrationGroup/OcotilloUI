import { Image, Page, Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { IObservation, IWell } from '@/interfaces/ocotillo'
import type { FieldCompilationStyles } from '../styles'
import { PageFooter } from '../../layout/PageFooter'
import type { PacketReading } from '../ownerSheetData'
import { buildPacketData } from '../ownerSheetData'

// The literal string must survive into the rendered document whenever there is
// no QR code (a restore-gate check greps for it), and it doubles as alt text
// alongside the caption when a code does render. Keep it in one place.
const QR_FALLBACK = '[QR Code]'

// Frame-safe local palette. Page 2 lives inside chrome's frame (chrome renders
// the 28pt left/right frame at the comfortable density the packet exports); all
// content is wrapped in a width-556 box starting at x=28 so every edge ends at
// <=584 and nothing goes edge-to-edge. Keep fixed widths off any element that
// must also read cleanly at the 516/556 body variants — columns use proportional
// flex, cards use a gap + grow so they stay inside the frame at either width.
const NAVY = '#1f386b'
const BORDER = '#9aa0a6'

function formatNumber(value: number | null | undefined, decimals: number): string {
  if (value == null || !Number.isFinite(value)) return ''
  return value.toFixed(decimals)
}

/** Newest-first already; sort by ISO text for a stable first/last range. */
function deriveRangeMonthYear(readings: { dateIso: string }[]): string | null {
  if (!readings || readings.length === 0) return null
  const sorted = [...readings].sort((a, b) =>
    a.dateIso > b.dateIso ? 1 : a.dateIso < b.dateIso ? -1 : 0
  )
  const fmt = (iso: string) => {
    const [y, m] = iso.slice(0, 10).split('-')
    return `${y}-${Number(m)}`
  }
  const first = sorted[0].dateIso.slice(0, 10)
  const last = sorted[sorted.length - 1].dateIso.slice(0, 10)
  return first === last ? fmt(first) : `${fmt(first)} – ${fmt(last)}`
}

export function OwnerSheetPage({
  well,
  observations,
  hydrographImage,
  styles,
  renderPageDate,
  showDate,
  pageNumber,
  totalPages,
  qrDataUrl,
}: {
  well: Partial<IWell>
  observations: readonly Partial<IObservation>[]
  hydrographImage?: string | null
  styles: FieldCompilationStyles
  renderPageDate: () => ReactElement
  showDate: boolean
  pageNumber: number
  totalPages: number
  /** PNG data URI QR supplied by the caller; absent → the literal placeholder prints. */
  qrDataUrl?: string | null
}): ReactElement {
  const data = buildPacketData({ well, observations }, qrDataUrl ?? null)

  // Newest (index 0) reading supplies the Previous Depth-to-Water strip value.
  const latest = data.readings[0] ?? null
  const prevDepth = latest ? formatNumber(latest.dtwFt, 2) : ''
  // react-pdf/pdfkit cannot decode an SVG data URI (it throws while embedding);
  // the shared packet data carries an SVG for the HTML packet, so only a bitmap
  // QR is rendered here and the literal placeholder covers the rest.
  const qrBitmap =
    data.qrDataUrl && !data.qrDataUrl.startsWith('data:image/svg') ? data.qrDataUrl : null
  const rangeLabel = deriveRangeMonthYear(data.readings)

  return (
    <Page size="LETTER" style={styles.page}>
      {/* Single content box: chrome's frame (rendered here as an inner wrapper,
          exactly like the proven page 1 layout) insets this by 28pt on both
          sides, so the box spans x=28..584 at the comfortable export. Every
          card/text below inherits that inset; absolutely positioned children
          (the date stamp) resolve against <Page> as they do on page 1. */}
      <View style={styles.pageFrame}>
        {/* ── Title block ──────────────────────────────────────────────── */}
        {showDate ? renderPageDate() : null}
        <Text style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>Owner Sheet</Text>
        <Text style={{ fontSize: 9, fontWeight: 500, marginBottom: 2, textTransform: 'uppercase' }}>
          Monthly Water Level Report
        </Text>
        <View style={{ height: 3, backgroundColor: NAVY, marginBottom: 10 }} />

        {/* ── Identity grid 2×2: Site Name | Point ID / Well Depth | OSE # */}
        <View style={{ flexDirection: 'row', width: '100%', gap: 10, marginBottom: 4 }}>
          <Card title="Site Name" value={data.siteName ?? ''} />
          <Card title="Point ID" value={data.pointId ?? ''} />
        </View>

        <View style={{ flexDirection: 'row', width: '100%', gap: 10, marginBottom: 5 }}>
          <Card
            title="Well Depth"
            value={data.wellDepthFt != null ? `${(data.wellDepthFt as number).toFixed(1)} ft` : ''}
          />
          <Card title="OSE #" value={data.oseNumber ?? ''} />
        </View>

        {/* ── Previous Depth-to-Water strip (slim full width) ───────────── */}
        <View style={{ borderWidth: 0.5, borderColor: BORDER, marginBottom: 4 }}>
          <Text style={{ fontSize: 7.5, fontWeight: 700, backgroundColor: NAVY, color: '#fff', padding: 3 }}>
            Previous Depth to Water Below Ground Surface
          </Text>
          <Text style={{ fontSize: 8, padding: 3 }}>
            {latest ? `${prevDepth} ft — ${latest.dateLabel}` : ''}
          </Text>
        </View>

        {/* ── Hydrograph (tighter height to fit readings table below) ───── */}
        <View style={{ flexDirection: 'row', width: '100%', height: 140, marginBottom: 4 }}>
          {/* Y-axis label — placed horizontally at the top of the hydrograph area.
              react-pdf's Text does not accept transform (TS2769), so a rotated vertical
              axis label is not feasible here. This horizontal label stays inside the frame
              and reads naturally below the title. */}
          <Text style={{ fontSize: 7, color: NAVY, fontWeight: 500, marginBottom: 1 }}>
            Depth to Water Below Ground Surface (ft)
          </Text>
          {/* Hydrograph image or placeholder — flex:1 fills remaining width below the label. */}
          <View style={{ flex: 1, height: 124 }}>
            {hydrographImage ? (
              <Image src={hydrographImage} style={{ width: '100%', height: 124, objectFit: 'contain' }} />
            ) : (
              <Text style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: BORDER, padding: 16, textAlign: 'center', fontSize: 7, color: '#6b7280' }}>
                No hydrograph available for this well.
              </Text>
            )}
          </View>
        </View>

        {/* ── Readings table: 26 / 18 / 18 / 38 ──────────────────────── */}
        <Table readings={data.readings} />

        {/* Page footer always sits at the very bottom inside chrome's frame */}
      </View>

        <PageFooter wellId={data.siteName} pageNumber={pageNumber} styles={styles} totalPages={totalPages} />

        {/* ── QR block + sign-off: direct child of <Page> so `bottom` resolves
            against the page box (inside pageFrame it resolved against the
            content bottom and landed on the readings table). ── */}
        <View
          style={{
            position: 'absolute',
            left: styles.pageFrame.paddingHorizontal,
            right: styles.pageFrame.paddingHorizontal,
            bottom: 34,
          }}
        >
          <View style={{ marginBottom: 8 }}>
            {qrBitmap ? (
              <Image src={qrBitmap} style={{ width: 62, height: 62 }} />
            ) : (
              <Text style={{ fontSize: 8 }}>{QR_FALLBACK}</Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', width: '100%' }}>
            <Text style={{ fontSize: 8 }}>{'Visited by: ____________________'}</Text>
          </View>
          <Text style={{ fontSize: 7 }}>{'Questions? nmbg.waterlevels@nmt.edu'}</Text>
        </View>

    </Page>
  )
}

/** Frame-safe identity card; grows to half the content box minus the row gap. */
function Card({ title, value }: { title: string; value: string }) {
  return (
    <View style={{ flexBasis: 0, flexGrow: 1, borderLeftWidth: 0 }}>
      <Text style={{ fontSize: 7.5, fontWeight: 700, backgroundColor: NAVY, color: '#fff', paddingVertical: 3, paddingHorizontal: 3 }}>{title}</Text>
      <Text style={{ fontSize: 8, paddingVertical: 2, paddingHorizontal: 3 }}>{value}</Text>
    </View>
  )
}

/** Four-column readings table (26 / 18 / 18 / 38). No column overflows or bumps its neighbour because each uses a proportional flex weight with zero basis. */
function Table({ readings }: { readings: PacketReading[] }) {
  const cols = [
    { label: 'Date', w: 26 },
    { label: 'Depth to Water Below Ground Surface (ft)', w: 18 },
    { label: 'MP Ht (ft)', w: 18 },
    { label: 'Level Status', w: 38 },
  ] as const
  return (
    <View style={{ borderWidth: 0.5, borderColor: BORDER, width: '100%' }}>
      <View style={{ flexDirection: 'row' }}>
        {cols.map((c) => (
          <Text key={c.label} style={{ flexBasis: 0, flexGrow: c.w, paddingVertical: 2, paddingHorizontal: 3, backgroundColor: NAVY, color: '#fff', fontSize: 7, fontWeight: 700 }}>{c.label}</Text>
        ))}
      </View>
      {readings.length > 0 ? readings.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', backgroundColor: i % 2 === 1 ? '#f4f5f7' : '#fff' }}>
          <Text style={{ flexBasis: 0, flexGrow: cols[0].w, paddingVertical: 2, paddingHorizontal: 3, fontSize: 7 }}>{r.dateLabel}</Text>
          <Text style={{ flexBasis: 0, flexGrow: cols[1].w, paddingVertical: 2, paddingHorizontal: 3, fontSize: 7 }}>{formatNumber(r.dtwFt, 2)}</Text>
          <Text style={{ flexBasis: 0, flexGrow: cols[2].w, paddingVertical: 2, paddingHorizontal: 3, fontSize: 7 }}>{formatNumber(r.mpHtFt, 2)}</Text>
          <Text style={{ flexBasis: 0, flexGrow: cols[3].w, paddingVertical: 2, paddingHorizontal: 3, fontSize: 7 }}>{r.levelStatus ?? ''}</Text>
        </View>
      )) : (
        <View style={{ flexDirection: 'row' }}>
          {cols.map((c) => (
            <Text key={c.label} style={{ flexBasis: 0, flexGrow: c.w, paddingVertical: 2, paddingHorizontal: 3, fontSize: 7 }}></Text>
          ))}
        </View>
      )}
    </View>
  )
}
