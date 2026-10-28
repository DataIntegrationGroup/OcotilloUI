import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { BaseRecord } from '@refinedev/core'
import { useMemo } from 'react'
import { usePrimaryAndSecondaryContact } from '@/hooks/usePrimaryAndSecondaryContact'
import type { IPdfDensity } from '@/interfaces'
import type { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'
import {
  buildPdfFilename,
  formatAddress,
  formatAppDate,
  sanitizeContacts,
} from '@/utils'
import { PHOTO_SLOT_CAP } from './fieldSheetPageLayout'
import { formatContactPhones } from './fieldCompilationPhoneFormatter'
import { PageFooter } from './layout/PageFooter'
import {
  FIELD_SHEET_NOTE_LINES,
  FIELD_SHEET_RULED_LINES,
  fieldSheetSlotPlan,
} from './fieldSheetPageLayout'

export const scaleForDensity = (
  comfortable: number,
  standard: number,
  compact: number,
  density: IPdfDensity = 'standard'
) =>
  density === 'compact'
    ? compact
    : density === 'comfortable'
      ? comfortable
      : standard

export type FieldCompilationStyles = ReturnType<
  typeof createFieldCompilationStyles
>

export const createFieldCompilationStyles = (
  density: IPdfDensity = 'standard'
) => {
  const scale = (c: number, st: number, k: number) =>
    scaleForDensity(c, st, k, density)

  return StyleSheet.create({
    page: {
      paddingTop: scale(18, 16, 12),
      paddingBottom: scale(18, 16, 12),
      paddingHorizontal: scale(22, 20, 14),
      backgroundColor: '#ffffff',
      fontSize: scale(9.5, 9, 8.5),
      color: '#111827',
    },
    pageDate: {
      position: 'absolute',
      top: 16,
      right: 20,
      fontSize: scale(9.5, 9, 8.5),
      color: '#111827',
    },
    footer: {
      position: 'absolute',
      bottom: scale(12, 10, 8),
      left: scale(22, 20, 14),
      right: scale(22, 20, 14),
    },
    footerText: {
      fontSize: scale(8, 7.5, 7),
      color: '#6b7280',
    },
    header: {
      marginBottom: scale(10, 8, 6),
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
      paddingBottom: 6,
    },
    title: {
      fontSize: 15,
      fontWeight: 700,
      textAlign: 'center',
    },
    headerDate: {
      fontSize: 9,
      textAlign: 'right',
      marginTop: 3,
    },
    content: {
      flexDirection: 'row',
      gap: 10,
    },
    // ── Column model — lane 33 (Amendment G).  A 60% / 33.33% split with a
    // persistent right-strip for photos.  The 60% side uses flex columns so
    // content flows into the available space naturally. ───────────────────
    columnContainer: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'nowrap',
    },
    contentColumn: {
      flex: 3,
      flexDirection: 'column',
      minWidth: 0,
    },
    photoColumn: {
      flex: 2,
      flexDirection: 'column',
      alignItems: 'flex-start',
      minWidth: 0,
    },
    rowRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: scale(2, 1.5, 1),
    },
    photoCell: {
      width: '100%',
      marginBottom: scale(4, 3, 2),
    },
    // ── End column model ──────────────────────────────────────────────────
    leftColumn: {
      width: '57%',
      paddingRight: 2,
    },
    rightColumn: {
      width: '43%',
    },
    section: {
      marginBottom: scale(9, 7, 5),
    },
    topGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 7,
    },
    topGridColumn: {
      flex: 1,
    },
    line: {
      marginBottom: 1,
    },
    label: {
      fontWeight: 700,
    },
    contactsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 3,
    },
    contactColumn: {
      flex: 1,
    },
    contactDetails: {
      marginTop: 3,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      marginBottom: 2,
    },
    noteText: {
      lineHeight: 1.15,
    },
    metricRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    metricCell: {
      flex: 1,
    },
    table: {
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f3f4f6',
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
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
    imageNoteRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 8,
      alignItems: 'stretch',
    },
    imageWrap: {
      width: '50%',
    },
    imageWrapFull: {
      width: '100%',
    },
    image: {
      width: '100%',
      height: 140,
      objectFit: 'cover',
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    imageLabel: {
      marginTop: 2,
      fontSize: 7,
      color: '#4b5563',
    },
    notePad: {
      width: '50%',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: '#ffffff',
    },
    notePadLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
      height: 10,
    },
    preVisitPad: {
      width: '100%',
      paddingTop: scale(6, 5, 4),
      paddingBottom: scale(6, 5, 4),
      paddingLeft: scale(6, 5, 4),
      paddingRight: scale(6, 5, 4),
    },
    ruledSlot: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      marginBottom: 8,
    },
    emptyImageState: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#d1d5db',
      padding: 12,
      textAlign: 'center',
      color: '#6b7280',
      fontSize: 9,
    },
    pageTitle: {
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 6,
    },
    hydrographImage: {
      width: '100%',
      height: 250,
      objectFit: 'contain',
      marginBottom: 8,
      maxWidth: '100%',
    },
    hydrographEmptyState: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#d1d5db',
      padding: 16,
      textAlign: 'center',
      color: '#6b7280',
      marginBottom: 12,
    },
    cutMethodBox: {
      borderWidth: 1,
      borderColor: '#d1d5db',
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
      color: '#4b5563',
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
    fillLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#6b7280',
      height: 16,
    },
    cutMethodTable: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      marginTop: 4,
    },
    cutMethodTableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
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
      borderRightColor: '#e5e7eb',
    },
    cutMethodTableValueCell: {
      width: '15.6%',
      paddingTop: 4,
      paddingHorizontal: 4,
      paddingBottom: 0,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
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
      borderRightColor: '#e5e7eb',
    },
    newMeasurementBox: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      padding: scale(3, 3, 2),
      marginBottom: scale(4, 3, 2),
    },
    newMeasurementHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 1,
    },
    newMeasurementTitle: {
      fontSize: 9,
      fontWeight: 700,
    },
    newMeasurementPrev: {
      fontSize: 8.5,
      fontWeight: 700,
      color: '#111827',
    },
    newMeasurementFieldRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 1,
    },
    newMeasurementField: {
      flex: 1,
    },
    newMeasurementFieldLabel: {
      fontSize: 7.5,
      fontWeight: 700,
      marginBottom: 0,
    },
    // Shorter write-in line so the box stays compact on page 1 (BDMS-1504).
    newWriteLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#6b7280',
      height: 7,
    },
    // Thin hairline grid used only for the new write-in measurement grid. Keeps
    // row/column separation without the heavy per-cell padding of cutMethod*.
    newGridRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    newGridHeaderCell: {
      width: '20%',
      paddingVertical: 2,
      paddingHorizontal: 3,
      fontSize: 7.5,
      fontWeight: 700,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    newGridLabelCell: {
      width: '20%',
      paddingVertical: 1,
      paddingHorizontal: 3,
      fontSize: 7,
      fontWeight: 700,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    newGridValueCell: {
      width: '20%',
      paddingTop: 1,
      paddingBottom: 0,
      paddingHorizontal: 2,
      borderRightWidth: 1,
      borderRightColor: '#e5e7eb',
    },
    notesPad: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      paddingTop: 2,
    },
    notesPadLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      height: 20,
    },
    blankPageBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    blankPageText: {
      fontSize: 12,
      color: '#111827',
      textAlign: 'center',
    },
  })
}

const lastMeasurementsColumns = [
  { key: 'date', label: 'Date', width: '16.67%' },
  { key: 'dtw', label: 'DTW Below MP (ft)', width: '16.67%' },
  { key: 'mpHeight', label: 'MP Ht (ft)', width: '16.67%' },
  { key: 'method', label: 'Method', width: '16.67%' },
  { key: 'status', label: 'Level Status', width: '16.67%' },
  // ALIGNMENT A7: the mock-up carries STAFF. No per-reading staff field
  // exists in the data model, so it prints the empty placeholder until one
  // does — the column is the argument for collecting it.
  { key: 'staff', label: 'Staff', width: '16.67%' },
] as const

const equipmentColumns = [
  { key: 'sensor_type', label: 'Equipment Type', width: '14.29%' },
  { key: 'sensor_model', label: 'Model', width: '14.29%' },
  { key: 'serial_no', label: 'Serial No', width: '14.29%' },
  { key: 'hanging_cable_length', label: 'Cable Length', width: '14.29%' },
  { key: 'recording_interval_display', label: 'Rec Interval', width: '14.29%' },
  { key: 'datetime_installed', label: 'Installed', width: '14.29%' },
  // ALIGNMENT A8: notes join the row instead of a second table.
  { key: 'notes', label: 'Notes', width: '14.29%' },
] as const

const manualMeasurementColumns = [
  { key: 'date', label: 'Date', width: '22%' },
  { key: 'dtw', label: 'DTW (ft)', width: '26%' },
  { key: 'mpHeight', label: 'MP Ht (ft)', width: '16%' },
  { key: 'status', label: 'Level Status', width: '36%' },
] as const

// Site Notes is now a single field inside Last Measurements (lane 32),
// not a separate table. The label column width is just for alignment.
const siteNotesFieldLabel = 'Site Notes:' as const

const cutMethodColumns = ['M1', 'M2', 'M3', 'M4', 'M5'] as const
const cutMethodRows = [
  'Time',
  'Hold',
  'Cut',
  'Tape Correction',
  'WL below MP',
  'MP Correction',
] as const

// Page-1 New Measurement write-in grid (BDMS-1504 lane11). Five columns, four
// labelled rows. Kept as a module const so the box JSX and the last-row rule
// (cutMethodTableRowLast) agree on the row count.
const newMeasurementGridRows = ['Hold', 'Cut', 'DTW Below MP (ft)', 'DTW BGS (ft)'] as const

type TableColumn<T> = {
  key: keyof T | string
  label: string
  width: string
}

const renderValue = (value: unknown, empty = '-') => {
  if (value == null || value === '') return empty
  return String(value)
}

const formatNumeric = (
  value: number | null | undefined,
  fractionDigits = 2,
  empty = '-'
): string => {
  if (value == null || Number.isNaN(value)) return empty
  return value.toFixed(fractionDigits)
}

const siteNameFromAlternateIds = (well: IWell): string => {
  const preferred =
    well.alternate_ids?.find(
      (alt) =>
        alt.relation?.toLowerCase() === 'same_as' &&
        alt.alternate_organization?.toLowerCase() === 'nmbgmr'
    )?.alternate_id ?? null

  return preferred ?? well.alternate_ids?.[0]?.alternate_id ?? '-'
}

const notesToText = (
  notes: Array<
    { content?: string | null; created_at?: string | null } | null | undefined
  >,
  options?: {
    sortByCreatedAt?: boolean
    compact?: boolean
  }
) => {
  const values = [...notes]
    .filter(Boolean)
    .sort((a, b) => {
      if (!options?.sortByCreatedAt) return 0
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0
      return aTime - bTime
    })
    .map((note) =>
      note?.content?.replace(/\s+/g, options?.compact ? ' ' : ' ').trim()
    )
    .filter((value): value is string => Boolean(value))

  if (values.length === 0) return '-'

  return options?.compact ? values.join(' | ') : values.join('\n')
}

const locationNotesText = (well: IWell) =>
  notesToText(
    (well.current_location?.properties?.notes ?? []).filter(
      (note: any) => note?.note_type === 'General'
    )
  )

/**
 * Direction notes region value (BDMS-1509). The data source is still open
 * (Q17), so this never parses or infers a direction from any other field — it
 * only forwards what the caller supplied, and collapses anything undefined,
 * null, or blank to an empty string. That keeps the label printing with nothing
 * beneath it (empty, not missing) and never returns a placeholder like 'N/A'
 * or '-'. Exported for tests and other display-only callers.
 */
export const directionNotesValue = (directionNotes?: string | null): string => {
  if (!directionNotes) return ''
  const trimmed = directionNotes.trim()
  return trimmed === '' ? '' : trimmed
}

const contactEmail = (contact?: IContact) => contact?.emails?.[0]?.email ?? '-'

const contactAddress = (contact?: IContact) => {
  const address = contact?.addresses?.[0]
  return address ? formatAddress(address) : '-'
}

const equipmentNotesText = (rows: SensorDeploymentRow[]) => {
  const notes = rows
    .map((row) => row.notes?.trim())
    .filter((note): note is string => Boolean(note && note !== '-'))
  return notes.length > 0 ? Array.from(new Set(notes)).join('\n') : '-'
}

/**
 * Site Notes field value — reads from the note array at
 * `well.site_notes` (legacy) or `well.notes`, joined as a single
 * text block. Falls back to `-` when empty.
 *
 * Note: `site_notes` at the top level is an array of NoteResponse
 * (see `IThing.ts`). We format them as a single paragraph rather
 * than a table (lane 32 merge).
 */
const siteNotesText = (well: IWell): string => {
  const sn = (well.site_notes as any) || []
  const nt = (well.notes as any) || []
  const notes =
    sn.length > 0
      ? sn
      : nt.length > 0
        ? nt
        : []
  const lines = notes
    .map((n: any) => n?.content?.trim())
    .filter((c: string) => c)
  return lines.length > 0 ? lines.join('\n') : '-'
}

const lastMeasurementsRows = (
  observations: readonly Partial<IObservation>[],
  sampleMethodsBySampleId: Record<number, string>
) =>
  [...observations]
    .filter((observation) => observation.observation_datetime)
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() -
        new Date(a.observation_datetime!).getTime()
    )
    .slice(0, 2)
    .map((observation) => ({
      date: formatAppDate(observation.observation_datetime),
      dtw:
        observation.depth_to_water_bgs != null
          ? formatNumeric(observation.depth_to_water_bgs)
          : '-',
      mpHeight:
        observation.measuring_point_height != null
          ? formatNumeric(observation.measuring_point_height)
          : '-',
      method:
        (observation.sample_id != null
          ? sampleMethodsBySampleId[observation.sample_id]
          : null) ?? '-',
      status:
        observation.groundwater_level_reason ?? observation.level_status ?? '-',
      staff: '-',
    }))

const manualMeasurementRows = (
  observations: readonly Partial<IObservation>[]
) =>
  [...observations]
    .filter((observation) => observation.observation_datetime)
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() -
        new Date(a.observation_datetime!).getTime()
    )
    .slice(0, 20)
    .map((observation) => ({
      date: formatAppDate(observation.observation_datetime),
      dtw:
        observation.depth_to_water_bgs != null
          ? formatNumeric(observation.depth_to_water_bgs)
          : '-',
      mpHeight:
        observation.measuring_point_height != null
          ? formatNumeric(observation.measuring_point_height)
          : '-',
      status:
        observation.groundwater_level_reason ?? observation.level_status ?? '-',
      staff: '-',
    }))

const PdfTable = <T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  compact = false,
  styles,
}: {
  title: string
  columns: readonly TableColumn<T>[]
  rows: T[]
  compact?: boolean
  styles: FieldCompilationStyles
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        {columns.map((column) => (
          <Text
            key={column.label}
            style={[
              styles.cellHeader,
              ...(compact ? [styles.compactCellHeader] : []),
              { width: column.width },
            ]}
          >
            {column.label}
          </Text>
        ))}
      </View>
      {(rows.length > 0 ? rows : [Object.create(null) as T]).map(
        (row, rowIndex, arr) => (
          <View
            key={rowIndex}
            style={[
              styles.tableRow,
              ...(rowIndex === arr.length - 1 ? [styles.tableRowLast] : []),
            ]}
          >
            {columns.map((column) => (
              <Text
                key={column.label}
                style={[
                  styles.cell,
                  ...(compact ? [styles.compactCell] : []),
                  { width: column.width },
                ]}
              >
                {rows.length > 0
                  ? renderValue(row[column.key as keyof T])
                  : '-'}
              </Text>
            ))}
          </View>
        )
      )}
    </View>
  </View>
)

const NoteSection = ({
  title,
  value,
  styles,
}: {
  title: string
  value: string
  styles: FieldCompilationStyles
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.noteText}>{value}</Text>
  </View>
)

const FieldCompilationNotesPage = ({
  well,
  contacts,
  assets,
  observations,
  sensorDeployments,
  hydrographImage,
  sampleMethodsBySampleId,
  includeConfidentialContacts,
  density = 'standard',
  showDate = true,
  emptyPlaceholder = '-',
  notesPlacement = 'column',
  firstPageOnly = false,
  directionNotes = '',
  includeAssets = true,
}: {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments: SensorDeploymentRow[]
  hydrographImage?: string | null
  sampleMethodsBySampleId: Record<number, string>
  includeConfidentialContacts: boolean
  density?: IPdfDensity
  showDate?: boolean
  emptyPlaceholder?: string
  notesPlacement?: 'column' | 'top'
  directionNotes?: string
  firstPageOnly?: boolean
  includeAssets?: boolean
}) => {
  const styles = useMemo(() => createFieldCompilationStyles(density), [density])

  const visibleContacts = useMemo(
    () => sanitizeContacts(contacts, includeConfidentialContacts),
    [contacts, includeConfidentialContacts]
  )
  const { primaryContact, secondaryContact } =
    usePrimaryAndSecondaryContact(visibleContacts)
  const measurements = useMemo(
    () => lastMeasurementsRows(observations, sampleMethodsBySampleId),
    [observations, sampleMethodsBySampleId]
  )
  const manualMeasurements = useMemo(
    () => manualMeasurementRows(observations),
    [observations]
  )
  const imageAssets = useMemo(
    () => {
      const filtered =
        assets
          .filter(
            (asset: any) =>
              asset?.signed_url &&
              typeof asset?.mime_type === 'string' &&
              asset.mime_type.startsWith('image/')
          )
          .slice()
      // Lane 33: sort newest-first (by created_at desc, then id desc), cap at 3
      filtered.sort((a: any, b: any) => {
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        }
        return (b.id as number ?? 0) - (a.id as number ?? 0)
      })
      return filtered.slice(0, 3)
    },
    [assets]
  )
  const { easting, northing } =
    well.current_location?.properties?.utm_coordinates ?? {}
  const exportDate = formatAppDate(new Date().toISOString())
  // Page 1 prints empty fields on the mock-up; '-' would read as data.
  const show = (value: unknown) => renderValue(value, emptyPlaceholder)
  const num = (value: number | null | undefined, fractionDigits = 2) =>
    formatNumeric(value, fractionDigits, emptyPlaceholder)
  const slotPlan = fieldSheetSlotPlan(imageAssets.length)
  const ruledLines = (keyPrefix: string, count: number) =>
    Array.from({ length: count }).map((_, index) => (
      <View key={`${keyPrefix}-line-${index}`} style={styles.notePadLine} />
    ))
  return (
    <>
      <Page size="LETTER" style={styles.page}>
        <PageFooter wellId={well.name} styles={styles} />
        {showDate ? <Text style={styles.pageDate}>{exportDate}</Text> : null}
        <View style={styles.header}>
          <Text style={styles.title}>Field Compilation Notes</Text>
        </View>
        {/* Lane 33 column model: 60% content + 33.33% photo strip */}
        <View style={styles.columnContainer}>
          {/* ── Content column (60%) ──────────────────────────────── */}
          <View style={styles.contentColumn}>
            {notesPlacement === 'top' ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Field Notes</Text>
                <View style={styles.notePad}>
                  {ruledLines('top', 4)}
                </View>
              </View>
            ) : null}

            {/* Row 1: 2-inner-column identity grid */}
            <View style={styles.rowRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Point ID: </Text>
                  {show(well.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Northing: </Text>
                  {num(northing, 0)}
                </Text>
              </View>
            </View>
            <View style={styles.rowRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Site Name: </Text>
                  {siteNameFromAlternateIds(well)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Easting: </Text>
                  {num(easting, 0)}
                </Text>
              </View>
            </View>
            <View style={styles.rowRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Primary Contact: </Text>
                  {show(primaryContact?.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Secondary Contact: </Text>
                  {show(secondaryContact?.name)}
                </Text>
              </View>
            </View>
            <View style={styles.rowRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Location Notes: </Text>
                  {locationNotesText(well)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>MP Height: </Text>
                  {`${num(well.measuring_point_height)} ${well.measuring_point_height_unit ?? ''}`.trim()}
                </Text>
              </View>
            </View>
            <View style={styles.rowRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Elevation: </Text>
                  {num(well.current_location?.properties?.elevation, 0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Well Depth: </Text>
                  {`${num(well.well_depth)} ${well.well_depth_unit ?? ''}`.trim()}
                </Text>
              </View>
            </View>
            <View style={styles.rowRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Last Measurements: </Text>
                  {measurements[0]
                    ? `${measurements[0].date} (${measurements[0].dtw} ft)`
                    : emptyPlaceholder}
                </Text>
              </View>
            </View>

            {/* ── Rows 2–7: flex columns that flow into content width ─── */}

            {/* Row 2: Contact details */}
            <View style={styles.section}>
              <View style={styles.contactsRow}>
                <View style={styles.contactColumn}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Primary Contact: </Text>
                    {show(primaryContact?.name)}
                  </Text>
                </View>
                <View style={styles.contactColumn}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Secondary Contact: </Text>
                    {show(secondaryContact?.name)}
                  </Text>
                </View>
              </View>
              <View style={styles.contactsRow}>
                <View style={[styles.contactColumn, styles.contactDetails]}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Address: </Text>
                    {contactAddress(primaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Phone: </Text>
                    {formatContactPhones(primaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Email: </Text>
                    {contactEmail(primaryContact)}
                  </Text>
                </View>
                <View style={[styles.contactColumn, styles.contactDetails]}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Address: </Text>
                    {contactAddress(secondaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Phone: </Text>
                    {formatContactPhones(secondaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Email: </Text>
                    {contactEmail(secondaryContact)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Row 3: Direction Notes */}
            <NoteSection
              styles={styles}
              title="Direction notes"
              value={directionNotesValue(directionNotes)}
            />
            <NoteSection
              styles={styles}
              title="Measurement Notes"
              value={notesToText(well.measuring_notes ?? [])}
            />
            <NoteSection
              styles={styles}
              title="MP Description"
              value={
                well.measuring_point_description?.trim() || emptyPlaceholder
              }
            />

            {/* Row 4: Pre-visit Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pre-visit Notes</Text>
              <View style={styles.preVisitPad}>
                {ruledLines('previsit', 3)}
              </View>
            </View>

            {/* Row 5: Last Measurements table */}
            <PdfTable
              styles={styles}
              title="Last Measurements"
              columns={lastMeasurementsColumns}
              rows={measurements}
              compact
            />

            {/* Row 5b: New Measurement write-in box */}
            <View style={styles.newMeasurementBox}>
              <View style={styles.newMeasurementHeaderRow}>
                <Text style={styles.newMeasurementTitle}>New Measurement</Text>
                {measurements[0] ? (
                  <Text style={styles.newMeasurementPrev}>
                    Previous DTW Below MP: {measurements[0].dtw} ft (
                    {measurements[0].date})
                  </Text>
                ) : null}
              </View>
              <View style={styles.newMeasurementFieldRow}>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Date: {exportDate}
                  </Text>
                </View>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Time: </Text>
                  <View style={styles.newWriteLine} />
                </View>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Staff: </Text>
                  <View style={styles.fillLine} />
                </View>
              </View>
              <View style={styles.cutMethodTable}>
                <View style={styles.cutMethodTableRow}>
                  <Text style={styles.cutMethodTableLabelCell} />
                  {cutMethodColumns.map((column, index) => (
                    <Text
                      key={column}
                      style={[
                        styles.cutMethodTableHeaderCell,
                        ...(index === cutMethodColumns.length - 1
                          ? [styles.cutMethodTableValueCellLast]
                          : []),
                      ]}
                    >
                      {column}
                    </Text>
                  ))}
                </View>
                {newMeasurementGridRows.map((rowLabel, rowIndex) => (
                  <View
                    key={rowLabel}
                    style={[
                      styles.cutMethodTableRow,
                      ...(rowIndex === newMeasurementGridRows.length - 1
                        ? [styles.cutMethodTableRowLast]
                        : []),
                    ]}
                  >
                    <Text style={styles.cutMethodTableLabelCell}>
                      {rowLabel}
                    </Text>
                    {cutMethodColumns.map((column, index) => (
                      <View
                        key={`${rowLabel}-${column}`}
                        style={[
                          styles.cutMethodTableValueCell,
                          ...(index === cutMethodColumns.length - 1
                            ? [styles.cutMethodTableValueCellLast]
                            : []),
                        ]}
                      >
                        <View style={styles.fillLine} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <View style={styles.newMeasurementFieldRow}>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Method: </Text>
                  <View style={styles.fillLine} />
                </View>
              </View>
              <View style={styles.newMeasurementFieldRow}>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Level Status: </Text>
                  <View style={styles.fillLine} />
                </View>
              </View>
              <View style={styles.newMeasurementFieldRow}>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Notes: </Text>
                  <View style={styles.fillLine} />
                </View>
              </View>
            </View>

            {/* Row 6: Installed Equipment table */}
            <PdfTable
              styles={styles}
              title="Installed Equipment"
              columns={equipmentColumns}
              rows={sensorDeployments
                .slice()
                .sort((a, b) => {
                  const aTime = a.datetime_installed
                    ? new Date(a.datetime_installed).getTime()
                    : 0
                  const bTime = b.datetime_installed
                    ? new Date(b.datetime_installed).getTime()
                    : 0
                  return bTime - aTime
                })
                .slice(0, 2)
                .map((row) => ({
                  sensor_type: row.sensor_type,
                  sensor_model: row.sensor_model,
                  serial_no: row.serial_no,
                  hanging_cable_length:
                    row.hanging_cable_length != null
                      ? String(row.hanging_cable_length)
                      : '-',
                  recording_interval_display:
                    row.recording_interval_display ?? '-',
                  datetime_installed: formatAppDate(row.datetime_installed),
                  notes: row.notes?.trim() || '-',
                }))}
              compact
            />

            {/* ── Site Notes as bottom field inside Last Measurements table ── */}
            {(() => {
              const sn = siteNotesText(well)
              return sn !== '-' ? (
                <View style={[styles.table]}>
                  <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                    <Text
                      style={[styles.cell, { flex: 1, fontWeight: 700 }]}
                    >
                      {siteNotesFieldLabel}
                    </Text>
                    <Text
                      style={[styles.cell, { flex: 5, lineHeight: 1.15 }]}
                    >
                      {sn}
                    </Text>
                  </View>
                </View>
              ) : null
            })()}
          </View>
          {/* ── End content column ─────────────────────────────────── */}

          {/* ── Photo column (33.33%, persistent right strip) ──────── */}
          {includeAssets && (
          <View style={styles.photoColumn}>
            {imageAssets.map((asset: any) => (
              <View key={asset.id ?? asset.signed_url} style={styles.photoCell}>
                <View style={styles.imageWrap}>
                  <Image src={asset.signed_url} style={styles.image} />
                  <Text style={styles.imageLabel}>
                    {asset.label || asset.name || ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          )}
          {/* ── End photo column ───────────────────────────────────── */}
        </View>
        {/* ── End columnContainer ──────────────────────────────────────── */}
      </Page>

      {firstPageOnly ? null : (
        <>
          <Page size="LETTER" style={styles.page}>
            {showDate ? (
              <Text style={styles.pageDate}>{exportDate}</Text>
            ) : null}
            <Text style={styles.pageTitle}>
              General Field Notes: {well.name}
            </Text>
            <View style={styles.cutMethodBox}>
              <Text style={styles.cutMethodEquation}>
                HOLD - CUT = Depth to Water (below MP)
              </Text>
              <Text style={styles.cutMethodHint}>
                Cut method field entry for steel-tape measurements. Record HOLD,
                record CUT, then subtract CUT from HOLD to get depth to water
                below the measuring point (MP).
              </Text>
              <View style={styles.cutMethodTable}>
                <View style={styles.cutMethodTableRow}>
                  <Text style={styles.cutMethodTableLabelCell}>Field</Text>
                  {cutMethodColumns.map((column, index) => (
                    <Text
                      key={column}
                      style={[
                        styles.cutMethodTableHeaderCell,
                        ...(index === cutMethodColumns.length - 1
                          ? [styles.cutMethodTableValueCellLast]
                          : []),
                      ]}
                    >
                      {column}
                    </Text>
                  ))}
                </View>
                {cutMethodRows.map((rowLabel, rowIndex) => (
                  <View
                    key={rowLabel}
                    style={[
                      styles.cutMethodTableRow,
                      ...(rowIndex === cutMethodRows.length - 1
                        ? [styles.cutMethodTableRowLast]
                        : []),
                    ]}
                  >
                    <Text style={styles.cutMethodTableLabelCell}>
                      {rowLabel}
                    </Text>
                    {cutMethodColumns.map((column, index) => (
                      <View
                        key={`${rowLabel}-${column}`}
                        style={[
                          styles.cutMethodTableValueCell,
                          ...(index === cutMethodColumns.length - 1
                            ? [styles.cutMethodTableValueCellLast]
                            : []),
                        ]}
                      >
                        <View style={styles.fillLine} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.sectionTitle}>General Field Notes</Text>
            <View style={styles.notesPad}>
              {Array.from({ length: 20 }).map((_, index) => (
                <View
                  key={`general-note-line-${index}`}
                  style={styles.notesPadLine}
                />
              ))}
            </View>
          </Page>

          <Page size="LETTER" style={styles.page}>
            {showDate ? (
              <Text style={styles.pageDate}>{exportDate}</Text>
            ) : null}
            <Text style={styles.pageTitle}>
              Hydrograph and Manual Measurements: {well.name}
            </Text>
            {hydrographImage ? (
              <Image src={hydrographImage} style={styles.hydrographImage} />
            ) : (
              <Text style={styles.hydrographEmptyState}>
                Hydrograph unavailable for this well.
              </Text>
            )}
            <PdfTable
              styles={styles}
              title="Manual Measurements"
              columns={manualMeasurementColumns}
              rows={manualMeasurements}
            />
          </Page>

          <Page size="LETTER" style={styles.page}>
            {showDate ? (
              <Text style={styles.pageDate}>{exportDate}</Text>
            ) : null}
            <View style={styles.blankPageBody}>
              <Text style={styles.blankPageText}>
                This page is intentionally left blank
              </Text>
            </View>
          </Page>
        </>
      )}
    </>
  )
}

export const FieldCompilationNotesPdf = ({
  well,
  contacts,
  assets,
  observations,
  sensorDeployments = [],
  hydrographImage,
  sampleMethodsBySampleId = {},
  includeConfidentialContacts = true,
  standalone = true,
  density = 'standard',
  showDate = true,
  emptyPlaceholder = '-',
  notesPlacement = 'column',
  firstPageOnly = false,
  directionNotes = '',
  includeAssets = true,
}: {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments?: SensorDeploymentRow[]
  hydrographImage?: string | null
  sampleMethodsBySampleId?: Record<number, string>
  includeConfidentialContacts?: boolean
  standalone?: boolean
  density?: IPdfDensity
  showDate?: boolean
  emptyPlaceholder?: string
  notesPlacement?: 'column' | 'top'
  directionNotes?: string
  firstPageOnly?: boolean
  includeAssets?: boolean
}) => {
  const pages = (
    <FieldCompilationNotesPage
      well={well}
      contacts={contacts}
      assets={assets}
      observations={observations}
      sensorDeployments={sensorDeployments}
      hydrographImage={hydrographImage}
      sampleMethodsBySampleId={sampleMethodsBySampleId}
      includeConfidentialContacts={includeConfidentialContacts}
      density={density}
      showDate={showDate}
      emptyPlaceholder={emptyPlaceholder}
      notesPlacement={notesPlacement}
      firstPageOnly={firstPageOnly}
      directionNotes={directionNotes}
      includeAssets={includeAssets}
    />
  )

  if (!standalone) return pages

  return (
    <Document
      title={buildPdfFilename(well)}
      subject="Field Compilation Notes"
      author="Ocotillo UI"
    >
      {pages}
    </Document>
  )
}
