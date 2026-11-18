import type { ComponentProps, ReactNode } from 'react'
import { Image, Page, Text, View, Svg, Rect, Path } from '@react-pdf/renderer'
import type { BaseRecord } from '@refinedev/core'
import type { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'
import { sanitizeContacts } from '@/utils'
import { APP_TIMEZONE } from '@/config/time'
import { pickPrimaryAndSecondaryContact } from '@/hooks/usePrimaryAndSecondaryContact'
import { formatPhone } from '@/utils/FormatPhone'
import { buildWeaverLocationUrl } from '@/utils/wellPublicUrls'
import { FCN_TOKENS, RULE_PITCH, fcnStyles as s } from './styles'

/*
 * Field Compilation Notes — react-pdf port of
 * repos/OcotilloMockups/field-notes-mockup.html (page 1 = field sheet,
 * page 2 = owner leave-behind). Pure and synchronous: no hooks, no fetching.
 * Empty values print blank — never "-", "None" or "N/A".
 */

type PdfStyle = NonNullable<ComponentProps<typeof View>['style']>
type Row = Record<string, string>

// ─── Formatting helpers ─────────────────────────────────────────────────────

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** MM/DD/YYYY in the app timezone (mockup format), '' when missing/invalid. */
export const formatSheetDate = (value: string | Date | null | undefined): string => {
  if (!value) return ''
  let d: Date
  if (typeof value === 'string') {
    const m = value.match(DATE_ONLY)
    d = m
      ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12))
      : new Date(value)
  } else {
    d = value
  }
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

const isNum = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v)

const fixed = (v: unknown, digits = 2): string => (isNum(v) ? v.toFixed(digits) : '')

/** Integers grouped by thousands (6,948); non-integers left as-is. */
const grouped = (v: unknown): string => {
  if (!isNum(v)) return ''
  const str = Number.isInteger(v) ? String(v) : v.toFixed(2)
  return str.includes('.') ? str : str.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** UTM coordinates print as plain integers (mockup: 721486, 3798214). */
const plainInt = (v: unknown): string => (isNum(v) ? v.toFixed(0) : '')

const text = (v: unknown): string => {
  if (v == null) return ''
  const str = String(v).trim()
  return str === '-' ? '' : str
}

const siteNameOf = (well: IWell): string =>
  text(
    well.alternate_ids?.find(
      (alt) =>
        alt.relation?.toLowerCase() === 'same_as' &&
        alt.alternate_organization?.toLowerCase() === 'nmbgmr'
    )?.alternate_id ?? well.alternate_ids?.[0]?.alternate_id
  )

const oseOf = (well: IWell): string =>
  text(well.alternate_ids?.find((alt) => alt.alternate_organization === 'OSE')?.alternate_id)

type NoteLike = { content?: string | null; note_type?: string | null } | null | undefined

const locationNotesOfType = (well: IWell, noteType: string): string =>
  ((well.current_location?.properties?.notes ?? []) as NoteLike[])
    .filter((note) => note?.note_type === noteType)
    .map((note) => note?.content?.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')

const isMobile = (type?: string | null) => /mobile|cell/i.test(type ?? '')

const phoneOf = (contact?: IContact): string => {
  const p = contact?.phones?.find((ph) => ph?.phone_number?.trim() && !isMobile(ph.phone_type))
  return p ? formatPhone(p.phone_number.trim()) : ''
}

const mobileOf = (contact?: IContact): string => {
  const p = contact?.phones?.find((ph) => ph?.phone_number?.trim() && isMobile(ph.phone_type))
  return p ? formatPhone(p.phone_number.trim()) : ''
}

const emailOf = (contact?: IContact): string => text(contact?.emails?.[0]?.email)

const newestFirst = (observations: readonly Partial<IObservation>[]) =>
  [...observations]
    .filter((o) => o.observation_datetime)
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() - new Date(a.observation_datetime!).getTime()
    )

/** DTW below MP = depth below ground surface + MP height (both must exist). */
const dtwBelowMp = (o: Partial<IObservation>): number | null =>
  isNum(o.depth_to_water_bgs) && isNum(o.measuring_point_height)
    ? o.depth_to_water_bgs + o.measuring_point_height
    : null

const levelStatusOf = (o: Partial<IObservation>): string =>
  text(o.groundwater_level_reason ?? o.level_status)

const recIntervalHours = (row: SensorDeploymentRow): string => {
  const units = row.recording_interval_units ?? ''
  if (row.recording_interval != null && row.recording_interval !== '' && /^h(ou)?rs?$|^hours?$/i.test(units.trim()))
    return text(row.recording_interval)
  return text(row.recording_interval_display)
}

const splitSiteNote = (content?: string | null) => {
  const normalized = content?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return null
  const m = normalized.match(/^(\d{4}-\d{2}-\d{2})\s*:\s*(.+)$/)
  return m
    ? { date: formatSheetDate(m[1]), sort: new Date(`${m[1]}T12:00:00Z`).getTime(), note: m[2].trim() }
    : { date: '', sort: null as number | null, note: normalized }
}

// ─── Shared building blocks ─────────────────────────────────────────────────

const Kv = ({ k, v, style }: { k: string; v: string; style?: PdfStyle }) => (
  <View style={style ? [s.kv, style].flat() : s.kv}>
    <Text style={s.k}>{k}</Text>
    <Text style={s.v}>{v}</Text>
  </View>
)

const Band = ({ children }: { children: ReactNode }) => <Text style={s.band}>{children}</Text>

type Col = { label: string; key: string; num?: boolean; tint?: 'stat' | 'note' }

/** `.tbl` — equal-width columns, hairline rules, zebra body, blank-safe. */
const Tbl = ({ cols, rows, style }: { cols: Col[]; rows: Row[]; style?: PdfStyle }) => (
  <View style={style ? [s.tbl, style].flat() : s.tbl}>
    <View style={s.tblRow}>
      {cols.map((c, i) => (
        <View key={c.key} style={i === cols.length - 1 ? [s.th, s.thEnd] : s.th}>
          <Text style={c.num ? [s.thText, s.num] : s.thText}>{c.label}</Text>
        </View>
      ))}
    </View>
    {rows.map((row, r) => (
      <View key={r} style={s.tblRow} wrap={false}>
        {cols.map((c) => {
          const cell: PdfStyle[] = [s.td]
          if (r % 2 === 1) cell.push(s.z)
          if (c.tint) cell.push(s[c.tint])
          return (
            <View key={c.key} style={cell}>
              <Text style={c.num ? [s.tdText, s.num] : s.tdText}>{row[c.key] ?? ''}</Text>
            </View>
          )
        })}
      </View>
    ))}
  </View>
)

/** `.ruled-field` — label left, text on 12 pt ruled lines (min `lines`). */
const RuledField = ({ label, value, lines }: { label: string; value: string; lines: number }) => (
  <View style={[s.ruledField, s.fnMainItem]} wrap={false}>
    <Text style={s.ruledLabel}>{label}</Text>
    <View style={[s.ruledArea, { minHeight: lines * RULE_PITCH }]}>
      {Array.from({ length: 14 }).map((_, i) => (
        <View key={i} style={[s.ruledLine, { top: (i + 1) * RULE_PITCH - 0.5 }]} />
      ))}
      <Text style={s.ruledText}>{value}</Text>
    </View>
  </View>
)

// ─── Page 1 sections ────────────────────────────────────────────────────────

/** 1 · `.hdr1` — title left, numeric print date right, 2 pt ink rule. */
const Hdr1 = ({ printed }: { printed: string }) => (
  <View style={[s.hdr1, s.p1Block]}>
    <Text style={s.hdr1Title}>Field Compilation Notes</Text>
    <Text style={s.hdr1Date}>{printed ? `Printed ${printed}` : ''}</Text>
  </View>
)

/** 2a · `.ident` — Point ID / Site Name | Easting / Northing | Elevation (ft). */
const Ident = ({ well }: { well: IWell }) => {
  const props = well.current_location?.properties
  const utm: { easting?: number | null; northing?: number | null } =
    props?.utm_coordinates ?? {}
  return (
    <View style={[s.ident, s.fnMainItem]}>
      <View style={[s.identCol, s.identColGap]}>
        <Kv k="Point ID" v={text(well.name)} style={s.identRowGap} />
        <Kv k="Site Name" v={siteNameOf(well)} />
      </View>
      <View style={[s.identCol, s.identColGap]}>
        <Kv k="Easting" v={plainInt(utm.easting)} style={s.identRowGap} />
        <Kv k="Northing" v={plainInt(utm.northing)} />
      </View>
      <View style={s.identCol}>
        <Kv k="Elevation (ft)" v={grouped(props?.elevation)} />
      </View>
    </View>
  )
}

/** 2b · `.contacts` — Primary (Name, Phone, Mobile) | Secondary (Name, Phone). */
const Contacts = ({ primary, secondary }: { primary?: IContact; secondary?: IContact }) => (
  <View style={[s.contacts, s.fnMainItem]}>
    <View style={[s.card, s.cardGap]}>
      <Text style={s.cardHead}>Primary Contact</Text>
      <Kv k="Name" v={text(primary?.name)} style={s.cardRow} />
      <Kv k="Phone" v={phoneOf(primary)} style={s.cardRow} />
      <Kv k="Mobile" v={mobileOf(primary)} />
    </View>
    <View style={s.card}>
      <Text style={s.cardHead}>Secondary Contact</Text>
      <Kv k="Name" v={text(secondary?.name)} style={s.cardRow} />
      <Kv k="Phone" v={phoneOf(secondary)} />
    </View>
  </View>
)

/** 3 · ruled blocks, in mockup order and min heights (48/48/24/12/12 pt). */
const RuledBlocks = ({ well }: { well: IWell }) => (
  <>
    <RuledField label="Location Notes" value={locationNotesOfType(well, 'General')} lines={4} />
    <RuledField label="Directions" value={locationNotesOfType(well, 'Directions')} lines={4} />
    <RuledField label="MP Description" value={text(well.measuring_point_description)} lines={2} />
    <RuledField label="MP Height (ft)" value={fixed(well.measuring_point_height)} lines={1} />
    <RuledField label="Well Depth (ft)" value={fixed(well.well_depth)} lines={1} />
  </>
)

/** 4 · `.photos` — up to three framed images, filename + description, stack caption. */
const Photos = ({ images }: { images: BaseRecord[] }) => (
  <View style={s.photos}>
    {images.map((asset: any, i) => {
      const name = text(asset?.name)
      const label = text(asset?.label)
      return (
        <View key={asset?.id ?? i} style={s.photo} wrap={false}>
          <View style={s.photoFrame}>
            <Image src={asset.signed_url} style={s.photoImage} />
          </View>
          <View style={s.capCol}>
            <Text style={s.capName}>{name}</Text>
            <Text style={s.cap}>{label && label !== name ? label : ''}</Text>
          </View>
        </View>
      )
    })}
    {images.length > 0 ? <Text style={s.stackcap}>Top 3 photos shown</Text> : null}
  </View>
)

const LAST_COLS: Col[] = [
  { key: 'date', label: 'Date' },
  { key: 'dtw', label: 'DTW Below MP (ft)', num: true },
  { key: 'mp', label: 'MP Ht (ft)', num: true },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Level Status', tint: 'stat' },
  { key: 'staff', label: 'Staff' },
]

const EQUIP_COLS: Col[] = [
  { key: 'type', label: 'Equipment Type' },
  { key: 'model', label: 'Model' },
  { key: 'serial', label: 'Serial No' },
  { key: 'cable', label: 'Cable Length (ft)', num: true },
  { key: 'interval', label: 'Rec Interval (hr)', num: true },
  { key: 'installed', label: 'Installed' },
  { key: 'notes', label: 'Notes', tint: 'note' },
]

/** 5a · Last Measurements — 6 equal columns, ≤2 rows newest first, then Site Notes field. */
const LastMeasurements = ({ rows, siteNotes }: { rows: Row[]; siteNotes: string }) => (
  <View style={[s.sect, s.p1Block]} wrap={false}>
    <Band>Last Measurements</Band>
    <Tbl cols={LAST_COLS} rows={rows} />
    <View style={s.sitenotes}>
      <View style={s.sitenotesK}>
        <Text style={s.sitenotesKText}>Site Notes</Text>
      </View>
      <View style={s.sitenotesV}>
        <Text style={s.tdText}>{siteNotes}</Text>
      </View>
    </View>
  </View>
)

/** 5b · Installed Equipment — 7 equal columns, ≤2 rows newest first. */
const InstalledEquipment = ({ rows }: { rows: Row[] }) => (
  <View style={[s.sect, s.p1Block]} wrap={false}>
    <Band>Installed Equipment</Band>
    <Tbl cols={EQUIP_COLS} rows={rows} />
  </View>
)

const NM_ROWS = [
  'Hold (ft)',
  'Cut (ft)',
  'Tape Correction (ft)',
  'WL Below MP (ft)',
  'MP Correction (ft)',
  'DTW Below MP (ft)',
  'DTW BGS (ft)',
]

const WCell = ({ label, tall, last }: { label: string; tall?: boolean; last?: boolean }) => (
  <View style={last ? s.wcell : [s.wcell, s.wcellGap]}>
    <Text style={s.wLabel}>{label}</Text>
    <View style={tall ? [s.wbox, s.wboxTall] : s.wbox} />
  </View>
)

/** 6 · New Measurement — boxed write-on block that fills the rest of the sheet. */
const NewMeasurement = ({ previous }: { previous: string }) => (
  <View style={s.nm} wrap={false}>
    <Band>New Measurement</Band>
    <View style={s.nmbox}>
      <Text style={[s.prev, s.nmItem]}>{previous}</Text>
      <View style={[s.wrow, s.nmItem]}>
        <WCell label="Date (MM/DD/YYYY)" />
        <WCell label="Time (24 h)" />
        <WCell label="Staff" last />
      </View>
      <View style={[s.mgrid, s.nmItem]}>
        <View style={s.mgridHeadRow}>
          {['', 'M1', 'M2', 'M3', 'M4', 'M5'].map((h, i) => (
            <View
              key={h || 'corner'}
              style={i === 5 ? [s.mgridTh, { borderRightColor: FCN_TOKENS.rule }] : s.mgridTh}
            >
              <Text style={s.thText}>{h}</Text>
            </View>
          ))}
        </View>
        {NM_ROWS.map((label) => (
          <View key={label} style={s.mgridRow}>
            <View style={[s.mgridCell, s.mgridRl, s.mgridRlCell]}>
              <Text style={s.mgridRlText}>{label}</Text>
            </View>
            {[1, 2, 3, 4, 5].map((m) => (
              <View key={m} style={[s.mgridCell, s.mgridW]} />
            ))}
          </View>
        ))}
      </View>
      <View style={s.wrow}>
        <WCell label="Method" tall />
        <WCell label="Level Status" tall />
        <WCell label="Measurement Notes" tall last />
      </View>
    </View>
  </View>
)

// ─── Data shaping (pure) ────────────────────────────────────────────────────

export const buildFieldSheetModel = ({
  well,
  contacts,
  assets,
  observations,
  sensorDeployments,
  sampleMethodsBySampleId,
  staffBySampleId,
  includeConfidentialContacts,
  printedAt = new Date(),
}: {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments: SensorDeploymentRow[]
  sampleMethodsBySampleId: Record<number, string>
  staffBySampleId: Record<number, string>
  includeConfidentialContacts: boolean
  printedAt?: Date
}) => {
  const visible = sanitizeContacts(contacts, includeConfidentialContacts)
  const { primaryContact, secondaryContact } = pickPrimaryAndSecondaryContact(visible)
  const ordered = newestFirst(observations)

  const lastRows: Row[] = ordered.slice(0, 2).map((o) => ({
    date: formatSheetDate(o.observation_datetime),
    dtw: fixed(dtwBelowMp(o)),
    mp: fixed(o.measuring_point_height),
    method: o.sample_id != null ? text(sampleMethodsBySampleId[o.sample_id]) : '',
    status: levelStatusOf(o),
    // Batch passes staffBySampleId; the single-well paths (preview, download)
    // carry the visit's staff on the observation row itself.
    staff:
      (o.sample_id != null ? text(staffBySampleId[o.sample_id]) : '') ||
      text((o as { water_level_measuring_staff?: string | null }).water_level_measuring_staff),
  }))

  const latest = ordered[0]
  const latestDtw = latest ? dtwBelowMp(latest) : null
  const previous =
    latest && latestDtw != null
      ? `Previous DTW Below MP: ${fixed(latestDtw)} ft (${formatSheetDate(latest.observation_datetime)})`
      : ''

  const equipmentRows: Row[] = [...sensorDeployments]
    .sort(
      (a, b) =>
        (b.datetime_installed ? new Date(b.datetime_installed).getTime() : 0) -
        (a.datetime_installed ? new Date(a.datetime_installed).getTime() : 0)
    )
    .slice(0, 2)
    .map((row) => ({
      type: text(row.sensor_type),
      model: text(row.sensor_model),
      serial: text(row.serial_no),
      cable: text(row.hanging_cable_length),
      interval: recIntervalHours(row),
      installed: formatSheetDate(row.datetime_installed),
      notes: text(row.notes),
    }))

  const siteNotes = [...((well.site_notes ?? well.notes ?? []) as Array<{ content?: string | null; created_at?: string | null } | null>)]
    .filter(Boolean)
    .map((n) => ({ parsed: splitSiteNote(n?.content), created: n?.created_at ? new Date(n.created_at).getTime() : 0 }))
    .filter((n) => n.parsed)
    .sort((a, b) => (b.parsed!.sort ?? b.created) - (a.parsed!.sort ?? a.created))
    .slice(0, 2)
    .map((n) => (n.parsed!.date ? `${n.parsed!.date}  ${n.parsed!.note}` : n.parsed!.note))
    .join('\n')

  const images = assets
    .filter(
      (asset: any) =>
        asset?.signed_url && typeof asset?.mime_type === 'string' && asset.mime_type.startsWith('image/')
    )
    .slice(0, 3)

  const readings: Row[] = ordered.slice(0, 10).map((o) => ({
    date: formatSheetDate(o.observation_datetime),
    bgs: fixed(o.depth_to_water_bgs),
    mp: fixed(o.measuring_point_height),
    status: levelStatusOf(o),
  }))

  const years = ordered.map((o) => new Date(o.observation_datetime!).getFullYear())
  const yearSpan = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''

  return {
    printed: formatSheetDate(printedAt),
    primaryContact,
    secondaryContact,
    lastRows,
    previous,
    equipmentRows,
    siteNotes,
    images,
    readings,
    yearSpan,
  }
}

// ─── Page 2 — Owner leave-behind ────────────────────────────────────────────

const Logo = () => (
  <Svg width={80} height={50} viewBox="0 0 80 50" style={s.hdr2Logo}>
    <Rect width={80} height={50} rx={3} fill="#1b4f72" />
    <Path d="M8 32 L19 15 L25 24 L31 17 L42 32 Z" fill="#8fb8d4" />
    <Path d="M8 36 q4.5 -3 9 0 t9 0 t9 0 t9 0" fill="none" stroke="#fff" strokeWidth={1.6} />
    <Text x={47} y={22} fill="#fff" style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>NMBG</Text>
    <Text x={47} y={31} fill="#cfe0ec" style={{ fontSize: 5.2 }}>Geology &amp;</Text>
    <Text x={47} y={38} fill="#cfe0ec" style={{ fontSize: 5.2 }}>Mineral Res.</Text>
  </Svg>
)

const InfoKv = ({ k, v, gap }: { k: string; v: string; gap?: boolean }) => (
  <View style={gap ? [s.fnInfoKv, s.fnInfoKvGap] : s.fnInfoKv}>
    <Text style={s.fnInfoK}>{k}</Text>
    <Text style={s.fnInfoV}>{v}</Text>
  </View>
)

const READING_COLS: Col[] = [
  { key: 'date', label: 'Date' },
  { key: 'bgs', label: 'Depth to water below ground surface (ft)', num: true },
  { key: 'mp', label: 'MP Height (ft)', num: true },
  { key: 'status', label: 'Level Status', tint: 'stat' },
]

const OwnerPage = ({
  well,
  model,
  hydrographImage,
  qrDataUrl,
}: {
  well: IWell
  model: ReturnType<typeof buildFieldSheetModel>
  hydrographImage?: string | null
  qrDataUrl?: string
}) => {
  const siteName = siteNameOf(well)
  const ose = oseOf(well)
  const depth = fixed(well.well_depth)
  const weaverUrl = buildWeaverLocationUrl(well.name)
  return (
    <Page size="LETTER" style={s.page}>
      {/* .hdr2 — logo, "Your Well: <site name>", network, 3 pt accent rule */}
      <View style={[s.hdr2, s.p2Block]}>
        <Logo />
        <View style={{ flex: 1 }}>
          <Text style={s.hdr2Title}>{`Your Well: ${siteName || text(well.name)}`}</Text>
          <Text style={s.hdr2Sub}>Healy Collaborative Groundwater Monitoring Network</Text>
        </View>
      </View>

      {/* .fn-info — R1 Site Name | Point ID; R2 Well Depth | OSE # (reflows when OSE absent) */}
      <View style={[s.fnInfo, s.p2Block]}>
        <View style={[s.fnInfoRow, s.fnInfoRowGap]}>
          <InfoKv k="Site Name" v={siteName} gap />
          <InfoKv k="Point ID" v={text(well.name)} />
        </View>
        <View style={s.fnInfoRow}>
          <InfoKv k="Well Depth" v={depth ? `${depth} ft` : ''} gap={Boolean(ose)} />
          {ose ? <InfoKv k="OSE #" v={ose} /> : null}
        </View>
      </View>

      {/* .hydbox — fixed height whether or not an image exists */}
      <View style={[s.hydbox, s.p2Block]} wrap={false}>
        <Text style={s.hydTitle}>
          {model.yearSpan ? `Depth to Water · ${model.yearSpan}` : 'Depth to Water'}
        </Text>
        {hydrographImage ? (
          <Image src={hydrographImage} style={s.hydImage} />
        ) : (
          <View style={[s.hydEmpty, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 9, color: FCN_TOKENS.muted }}>Hydrograph unavailable</Text>
          </View>
        )}
      </View>

      {/* readings — 4 equal columns, spelled-out header, ≤10 rows */}
      <Tbl cols={READING_COLS} rows={model.readings} style={s.p2Block} />

      {/* .foot — QR + Weaver URL | For questions?; team inbox ↔ owner email */}
      <View style={s.foot} wrap={false}>
        <View style={s.footR1}>
          <View style={s.qrblk}>
            <Text style={s.qrLead}>See your well data online</Text>
            {qrDataUrl ? (
              <Image src={qrDataUrl} style={s.qrImage} />
            ) : (
              <View style={s.qrPlaceholder}>
                <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: FCN_TOKENS.muted }}>QR</Text>
              </View>
            )}
            <Text style={s.qrUrl}>{weaverUrl ? weaverUrl.replace(/^https?:\/\//, '') : ''}</Text>
          </View>
          <View style={s.ask}>
            <Text style={s.askQ}>For questions?</Text>
            <Text style={s.askLine}>New Mexico Bureau of Geology &amp; Mineral Resources</Text>
            <Text style={s.askLine}>801 Leroy Place, Socorro, NM 87801</Text>
            {/* No 24-hour-line field exists on the well/contact data path, so the
                value prints blank rather than a placeholder number. */}
            <Text style={s.askLine}>
              <Text style={s.k}>24-hour line</Text>
            </Text>
          </View>
        </View>
        <View style={s.emails}>
          <Text style={s.emailText}>ocotillo-nmbg@nmt.edu</Text>
          <Text style={s.emailText}>{emailOf(model.primaryContact)}</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── Document pages ─────────────────────────────────────────────────────────

export interface FieldCompilationNotesPageProps {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments: SensorDeploymentRow[]
  hydrographImage?: string | null
  sampleMethodsBySampleId: Record<number, string>
  /** Staff on the visit that produced each sample (Last Measurements · Staff). */
  staffBySampleId?: Record<number, string>
  includeConfidentialContacts: boolean
  qrDataUrl?: string
  /** Page 2 (owner leave-behind). Off → the field sheet only. */
  includeOwnerPage?: boolean
}

const FieldCompilationNotesPage = ({
  well,
  contacts,
  assets,
  observations,
  sensorDeployments,
  hydrographImage,
  sampleMethodsBySampleId,
  staffBySampleId = {},
  includeConfidentialContacts,
  qrDataUrl,
  includeOwnerPage = true,
}: FieldCompilationNotesPageProps) => {
  const m = buildFieldSheetModel({
    well,
    contacts,
    assets,
    observations,
    sensorDeployments,
    sampleMethodsBySampleId: sampleMethodsBySampleId ?? {},
    staffBySampleId,
    includeConfidentialContacts,
  })

  return (
    <>
      {/* ═══════ PAGE 1 — Field Compilation Notes (field sheet) ═══════ */}
      <Page size="LETTER" style={s.page}>
        <Hdr1 printed={m.printed} />
        <View style={s.top}>
          <View style={s.fnMain}>
            <Ident well={well} />
            <Contacts primary={m.primaryContact} secondary={m.secondaryContact} />
            <RuledBlocks well={well} />
          </View>
          <Photos images={m.images} />
        </View>
        <LastMeasurements rows={m.lastRows} siteNotes={m.siteNotes} />
        <InstalledEquipment rows={m.equipmentRows} />
        <NewMeasurement previous={m.previous} />
      </Page>

      {includeOwnerPage ? (
        <OwnerPage well={well} model={m} hydrographImage={hydrographImage} qrDataUrl={qrDataUrl} />
      ) : null}
    </>
  )
}

export default FieldCompilationNotesPage
