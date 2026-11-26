import { ComponentProps, ReactNode } from 'react'
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

type PdfStyle = NonNullable<ComponentProps<typeof View>['style']>
type Row = Record<string, string>

// ─── Formatting helpers ─────────────────────────────────────────────────────

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

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

const grouped = (v: unknown): string => {
  if (!isNum(v)) return ''
  const str = Number.isInteger(v) ? String(v) : v.toFixed(2)
  return str.includes('.') ? str : str.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const plainInt = (v: unknown): string => (isNum(v) ? v.toFixed(0) : '')

/**
 * Bureau 24-hour line. No API field carries it yet, so this is the placeholder
 * the sheet prints; the real number is expected to come from the database
 * (Rob, 2026-11-22). Callers can override with the `hotlinePhone` prop.
 */
export const FCN_HOTLINE_PHONE = '(575) 555-0199'

/** Team / data-research address on page 2 — a fixed literal, never looked up. */
export const FCN_TEAM_EMAIL = 'ocotillo-nmbg@nmt.edu'

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

// Same pick as well-show.tsx (NMOSE + OSEPOD); any NMOSE id is the fallback.
const oseOf = (well: IWell): string => {
  const ose = (well.alternate_ids ?? []).filter((alt) => alt?.alternate_organization === 'NMOSE')
  return text((ose.find((alt) => alt.relation === 'OSEPOD') ?? ose[0])?.alternate_id)
}

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

const dtwBelowMp = (o: Partial<IObservation>): number | null =>
  isNum(o.depth_to_water_bgs) && isNum(o.measuring_point_height)
    ? o.depth_to_water_bgs + o.measuring_point_height
    : null

const levelStatusOf = (o: Partial<IObservation>): string =>
  text(o.groundwater_level_reason ?? o.level_status)

const recIntervalHours = (row: SensorDeploymentRow): string => {
  const units = row.recording_interval_units ?? ''
  if (row.recording_interval != null && row.recording_interval !== '' && /^h(ou)?rs?|^hours?$/i.test(units.trim()))
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

const Band = ({ children, type }: { children: ReactNode; type?: 'site' | 'previsit' }) => (
  <Text style={type === 'previsit' ? [s.band, s.preVisitBand] : s.band}>{children}</Text>
)

type Col = { label: string; key: string; num?: boolean; tint?: 'stat' | 'note'; flex?: number }

const Tbl = ({ cols, rows, style }: { cols: Col[]; rows: Row[]; style?: PdfStyle }) => {
  // Mockup tables are CSS grids: tracks are exact fr shares of the row width.
  // Flex-grow over `flexBasis: 0` instead distributes only the space left after
  // each cell's padding/border, so the tracks drift right by up to 10 pt.
  const fr = cols.reduce((sum, c) => sum + (c.flex ?? 1), 0)
  const track = (c: Col): PdfStyle => ({
    width: `${((((c.flex ?? 1) / fr) * 100)).toFixed(4)}%`,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    minWidth: 0,
  })
  return (
    <View style={style ? [s.tbl, style].flat() : s.tbl}>
    <View style={s.tblRow}>
      {cols.map((c, i) => (
        <View
          key={c.key}
          style={[
            i === cols.length - 1 ? [s.th, s.thEnd] : s.th,
            c.num ? s.thNum : {},
            track(c),
          ]}
        >
          <Text style={c.num ? [s.thText, s.thNumText] : s.thText}>{c.label}</Text>
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
            <View
              key={c.key}
              style={[cell, track(c)]}
            >
              <Text style={c.num ? [s.tdText, s.num] : s.tdText}>{row[c.key] ?? ''}</Text>
            </View>
          )
        })}
      </View>
    ))}
    </View>
  )
}

const RuledField = ({ label, value, lines }: { label: string; value: string; lines: number }) => (
  <View style={s.ruledField} wrap={false}>
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

const Hdr1 = ({ printed }: { printed: string }) => (
  <View style={[s.hdr1, s.p1Block]}>
    <Text style={s.hdr1Title}>Field Compilation Notes</Text>
    <Text style={s.hdr1Date}>{printed ? `Printed ${printed}` : ''}</Text>
  </View>
)

const Ident = ({ well, mapsQrDataUrl }: { well: IWell; mapsQrDataUrl?: string | null }) => {
  const props = well.current_location?.properties
  const utm: { easting?: number | null; northing?: number | null } =
    props?.utm_coordinates ?? {}
  const coords = well.current_location?.geometry?.coordinates as [number, number, number] | undefined

  // Mockup `.ident-grid`: three equal tracks filled row-major, Site Name spanning
  // the full width; `.idqr` (52 pt Google Maps QR) sits to the right of the grid.
  return (
    <View style={s.ident}>
      <View style={s.identGrid}>
        <View style={[s.identRow, s.identRowGap]}>
          <Kv k="Point ID" v={text(well.name)} style={[s.identCol, s.identColGap]} />
          <Kv k="Easting" v={plainInt(utm.easting)} style={[s.identCol, s.identColGap]} />
          <Kv k="Northing" v={plainInt(utm.northing)} style={s.identCol} />
        </View>
        <View style={[s.identRow, s.identRowGap]}>
          <Kv k="Site Name" v={siteNameOf(well)} style={s.identCol} />
        </View>
        <View style={s.identRow}>
          <Kv k="Elevation (ft)" v={grouped(props?.elevation)} style={[s.identCol, s.identColGap]} />
          <Kv k="Longitude" v={coords ? coords[0].toFixed(5) : ''} style={[s.identCol, s.identColGap]} />
          <Kv k="Latitude" v={coords ? coords[1].toFixed(5) : ''} style={s.identCol} />
        </View>
      </View>
      {mapsQrDataUrl ? <Image src={mapsQrDataUrl} style={s.idqr} /> : null}
    </View>
  )
}

const Contacts = ({ primary, secondary }: { primary?: IContact; secondary?: IContact }) => (
  <View style={s.contacts}>
    <View style={[s.card, s.cardGap]}>
      <Text style={s.cardHead}>Primary Contact</Text>
      <Kv k="Name" v={text(primary?.name)} />
      <Kv k="Role / Relationship" v={text(primary?.role)} />
      <Kv k="Phone" v={phoneOf(primary)} />
      {mobileOf(primary) ? <Kv k="Mobile" v={mobileOf(primary)} /> : null}
    </View>
    <View style={s.card}>
      <Text style={s.cardHead}>Secondary Contact</Text>
      <Kv k="Name" v={text(secondary?.name)} />
      <Kv k="Role / Relationship" v={text(secondary?.role)} />
      <Kv k="Phone" v={phoneOf(secondary)} />
    </View>
  </View>
)

const RuledBlocks = ({ well }: { well: IWell }) => (
  <>
    {/* No Pre-Visit note type exists in the backend yet, so this field prints
        blank by design — it is where pre-visit notes will go once recorded
        (Rob, 2026-11-22). */}
    <RuledField label="Pre-Visit Notes" value="" lines={3} />
    <RuledField label="Location Notes" value={locationNotesOfType(well, 'General')} lines={3} />
    <RuledField label="Directions" value={locationNotesOfType(well, 'Directions')} lines={3} />
    <RuledField label="MP Description" value={text(well.measuring_point_description)} lines={2} />
    <View style={s.rfPair}>
      <View style={s.rfPairCellLeft}>
        <RuledField label="Well Depth (ft)" value={fixed(well.well_depth)} lines={1} />
      </View>
      <View style={s.rfPairCellRight}>
        <RuledField label="MP Height (ft)" value={fixed(well.measuring_point_height)} lines={1} />
      </View>
    </View>
  </>
)

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
            <Text style={s.cap}>{label && label !== name ? label : ''}</Text>
          </View>
        </View>
      )
    })}
    {images.length > 0 ? <Text style={s.stackcap}>Top 3 photos shown</Text> : null}
  </View>
)

// Proportions mirror the mockup grid (0.9fr 1.1fr 0.8fr 0.9fr 0.7fr 2.4fr) — the
// wider DTW column is what keeps "DTW BELOW MP (FT)" on one line.
const LAST_COLS: Col[] = [
  { key: 'date', label: 'Date', flex: 0.9 },
  { key: 'dtw', label: 'DTW Below MP (ft)', num: true, flex: 1.1 },
  { key: 'method', label: 'Method', flex: 0.8 },
  { key: 'status', label: 'Level Status', tint: 'stat', flex: 0.9 },
  { key: 'staff', label: 'Staff', flex: 0.7 },
  { key: 'siteNotes', label: 'Site Notes', flex: 2.4, tint: 'note' },
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

/** 5a · Last Measurements — 6 columns with proportional Site Notes. */
const LastMeasurements = ({ rows }: { rows: Row[] }) => (
  <View style={[s.sect, s.p1Block]} wrap={false}>
    <Band>Last Measurements</Band>
    <Tbl cols={LAST_COLS} rows={rows} />
  </View>
)

const InstalledEquipment = ({ rows }: { rows: Row[] }) => (
  <View style={[s.sect, s.p1Block]} wrap={false}>
    <Band>Installed Equipment</Band>
    <Tbl cols={EQUIP_COLS} rows={rows} />
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
        <WCell label="General Notes" tall last />
      </View>
    </View>
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
  'Time (24 h)',
]

const WCell = ({ label, tall, last }: { label: string; tall?: boolean; last?: boolean }) => (
  <View style={last ? s.wcell : [s.wcell, s.wcellGap]}>
    <Text style={s.wLabel}>{label}</Text>
    <View style={tall ? [s.wbox, s.wboxTall] : s.wbox} />
  </View>
)

// Mockup `.wf.inl`: bold label with a 12 pt rule filling the rest of the cell.
const WInline = ({ label, last }: { label: string; last?: boolean }) => (
  <View style={last ? s.wInlineCell : [s.wInlineCell, s.wInlineGap]}>
    <Text style={s.wInlineLabel}>{label}</Text>
    <View style={s.wRule} />
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
  staffBySampleId?: Record<string, string>
  includeConfidentialContacts: boolean
  printedAt?: Date
}) => {
  const visible = sanitizeContacts(contacts, includeConfidentialContacts)
  const { primaryContact, secondaryContact } = pickPrimaryAndSecondaryContact(visible)
  const ordered = newestFirst(observations)

  const lastRows: Row[] = ordered.slice(0, 2).map((o) => {
    return {
      date: formatSheetDate(o.observation_datetime),
      dtw: fixed(dtwBelowMp(o)),
      // Sample lookup first (preview / batch); well-show rows already carry the
      // sample's method as `water_level_method` (well-show.tsx recentObservations).
      method: (o.sample_id != null ? text(sampleMethodsBySampleId[o.sample_id]) : '') || text((o as any).water_level_method),
      status: levelStatusOf(o),
      staff: (o.sample_id != null ? text(staffBySampleId?.[String(o.sample_id)]) : '') || text((o as any).water_level_measuring_staff),
      siteNotes: '', // Handled separately by Site Notes field
    }
  })

  const latest = ordered[0]

  // Page-2 named staff: the staff shown for the latest measurement, matched by
  // name against the contacts already loaded for this well. No match -> no
  // email / mobile (blank, never guessed).
  const latestStaff = lastRows[0]?.staff ?? ''
  const staffContact = latestStaff
    ? visible.find((c) => text(c?.name) === latestStaff)
    : undefined
  const fieldStaff = {
    name: latestStaff,
    mobile: mobileOf(staffContact),
    email: emailOf(staffContact),
  }

  const latestDtw = latest ? dtwBelowMp(latest) : null
  const previous =
    latest && latestDtw != null
      ? `Previous DTW Below MP: ${fixed(latestDtw)} ft (${formatSheetDate(latest.observation_datetime)})`
      : ''

  const equipmentRows: Row[] = [...sensorDeployments]
    .sort((a, b) => (b.datetime_installed ? new Date(b.datetime_installed).getTime() : 0) - (a.datetime_installed ? new Date(a.datetime_installed).getTime() : 0))
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

  // Site notes belong to the site, not to an observation: the newest row
  // carries them, older rows stay blank.
  if (siteNotes && lastRows[0]) lastRows[0] = { ...lastRows[0], siteNotes }

  const images = assets
    .filter((asset: any) => asset?.signed_url && typeof asset?.mime_type === 'string' && asset.mime_type.startsWith('image/'))
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
    fieldStaff,
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

const InfoKv = ({ k, v, gap, flex }: { k: string; v: string; gap?: boolean; flex?: number }) => (
  <View style={[gap ? [s.fnInfoKv, s.fnInfoKvGap] : s.fnInfoKv, flex != null ? { flex } : {}].flat()}>
    <Text style={s.fnInfoK}>{k}</Text>
    <Text style={s.fnInfoV}>{v}</Text>
  </View>
)

// Mockup `.tbl` grid is `1.1fr 1.4fr 1fr`; MP Height is a well attribute (header
// + page-2 info block), not a per-reading column, so the table stays 3 columns.
const READING_COLS: Col[] = [
  { key: 'date', label: 'Date', flex: 1.1 },
  { key: 'bgs', label: 'Depth to water below ground surface (ft)', num: true, flex: 1.4 },
  { key: 'status', label: 'Level Status', tint: 'stat', flex: 1 },
]

const OwnerPage = ({
  well,
  model,
  hydrographImage,
  qrDataUrl,
  hotlinePhone,
  fieldStaffContact,
}: {
  well: IWell
  model: ReturnType<typeof buildFieldSheetModel>
  hydrographImage?: string | null
  qrDataUrl?: string
  hotlinePhone?: string
  /** Backend-resolved staff contact for this well; when present it wins over
   *  the name match against the well's loaded contacts. */
  fieldStaffContact?: IContact
}) => {
  const siteName = siteNameOf(well)
  const depth = fixed(well.well_depth)
  const mpHeight = fixed(well.measuring_point_height)
  const fieldStaff = fieldStaffContact
    ? {
        name: text(fieldStaffContact.name) || model.fieldStaff.name,
        mobile: mobileOf(fieldStaffContact),
        email: emailOf(fieldStaffContact),
      }
    : model.fieldStaff
  const weaverUrl = buildWeaverLocationUrl(well.name)
  return (
    <Page size="LETTER" style={s.page}>
      <View style={[s.hdr2, s.p2Block]}>
        <Logo />
        <View style={{ flex: 1 }}>
          <Text style={s.hdr2Title}>{`Your Well: ${siteName || text(well.name)}`}</Text>
          <Text style={s.hdr2Sub}>Healy Collaborative Groundwater Monitoring Network</Text>
        </View>
      </View>

      <View style={[s.fnInfo, s.p2Block]}>
        {/* Mockup `.fn-info .row`: 1.05fr 0.975fr 0.975fr tracks. OSE # has no
            backend field on this path, so it prints blank. */}
        <View style={s.fnInfoRow}>
          <InfoKv k="Site Name" v={siteName} gap flex={1.05} />
          <InfoKv k="Well Depth" v={depth ? `${depth} ft` : ''} gap flex={0.975} />
          <InfoKv k="MP Height" v={mpHeight ? `${mpHeight} ft` : ''} flex={0.975} />
        </View>
        <View style={s.fnInfoRow}>
          <InfoKv k="Point ID" v={text(well.name)} gap flex={1.05} />
          <InfoKv k="OSE #" v={oseOf(well)} gap flex={0.975} />
          <View style={{ flex: 0.975 }} />
        </View>
      </View>

      <View style={[s.hydbox, s.p2Block]} wrap={false}>
        <Text style={s.hydTitle}>{model.yearSpan ? `Depth to Water · ${model.yearSpan}` : 'Depth to Water'}</Text>
        {hydrographImage ? (
          <Image src={hydrographImage} style={s.hydImage} />
        ) : (
          <View style={[s.hydEmpty, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 9, color: FCN_TOKENS.muted }}>Hydrograph unavailable</Text>
          </View>
        )}
      </View>

      <Tbl cols={READING_COLS} rows={model.readings} style={s.p2Block} />

      <View style={s.foot} wrap={false}>
        <View style={s.footR1}>
          <View style={s.qrblk}>
            <Text style={s.qrLead}>See your well data online</Text>
            {qrDataUrl ? (
              <Image src={qrDataUrl} style={s.qrImage} />
            ) : (
              <View style={s.qrPlaceholder}><Text style={{ fontSize: 7 }}>QR</Text></View>
            )}
            <Text style={s.qrUrl}>{weaverUrl ? weaverUrl.replace(/^https?:\/\//, '') : ''}</Text>
          </View>
          <View style={s.ask}>
            <Text style={s.askQ}>For questions?</Text>
            <Text style={s.askLine}>New Mexico Bureau of Geology &amp; Mineral Resources</Text>
            <Text style={s.askLine}>801 Leroy Place, Socorro, NM 87801</Text>
            {fieldStaff.name ? (
              <Text style={s.askLine}>
                <Text style={s.k}>Field staff</Text>
                {`  ${fieldStaff.name}${fieldStaff.mobile ? ` · ${fieldStaff.mobile}` : ''}`}
              </Text>
            ) : null}
            <Text style={s.askLine}>
              <Text style={s.k}>24-hour line</Text>
              {hotlinePhone ? `  ${hotlinePhone}` : ''}
            </Text>
          </View>
        </View>
        <View style={s.emails}>
          <Text style={s.emailText}>{FCN_TEAM_EMAIL}</Text>
          {fieldStaff.email ? <Text style={s.emailText}>{fieldStaff.email}</Text> : null}
        </View>
      </View>
    </Page>
  )
}

export interface FieldCompilationNotesPageProps {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments: SensorDeploymentRow[]
  hydrographImage?: string | null
  sampleMethodsBySampleId: Record<number, string>
  staffBySampleId?: Record<string, string>
  includeConfidentialContacts: boolean
  qrDataUrl?: string
  /** Page-1 Google Maps QR (ident block). Empty -> not drawn. */
  mapsQrDataUrl?: string | null
  includeOwnerPage?: boolean
  /** 24-hour line printed on page 2; defaults to FCN_HOTLINE_PHONE. */
  hotlinePhone?: string
  /** Backend-resolved staff contact for page 2; wins over the name match. */
  fieldStaffContact?: IContact
}

const FieldCompilationNotesPage = ({
  well,
  contacts,
  assets,
  observations,
  sensorDeployments,
  hydrographImage,
  sampleMethodsBySampleId,
  staffBySampleId,
  includeConfidentialContacts,
  includeOwnerPage,
  qrDataUrl,
  mapsQrDataUrl,
  hotlinePhone = FCN_HOTLINE_PHONE,
  fieldStaffContact,
}: FieldCompilationNotesPageProps) => {
  const m = buildFieldSheetModel({
    well,
    contacts,
    assets,
    observations,
    sensorDeployments,
    sampleMethodsBySampleId,
    staffBySampleId,
    includeConfidentialContacts,
  })

  return (
    <>
      <Page size="LETTER" style={s.page}>
        <Hdr1 printed={m.printed} />
        <View style={s.top}>
          <View style={s.fnMain}>
            <Ident well={well} mapsQrDataUrl={mapsQrDataUrl} />
            <Contacts primary={m.primaryContact} secondary={m.secondaryContact} />
            <RuledBlocks well={well} />
          </View>
          <Photos images={m.images} />
        </View>
        <LastMeasurements rows={m.lastRows} />
        <InstalledEquipment rows={m.equipmentRows} />
        <NewMeasurement previous={m.previous} />
      </Page>

      {includeOwnerPage !== false && (
        <OwnerPage
          well={well}
          model={m}
          hydrographImage={hydrographImage}
          qrDataUrl={qrDataUrl}
          hotlinePhone={hotlinePhone}
          fieldStaffContact={fieldStaffContact}
        />
      )}
    </>
  )
}

export default FieldCompilationNotesPage
