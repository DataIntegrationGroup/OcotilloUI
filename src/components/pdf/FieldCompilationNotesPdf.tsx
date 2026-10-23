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
import type { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'
import {
  buildPdfFilename,
  formatAddress,
  formatAppDate,
  sanitizeContacts,
} from '@/utils'
import { formatContactPhones } from './fieldCompilationPhoneFormatter'
import {
  FIELD_SHEET_NOTE_LINES,
  FIELD_SHEET_RULED_LINES,
  fieldSheetSlotPlan,
  PHOTO_SLOT_CAP,
} from './fieldSheetPageLayout'
import { PageFooter } from './layout/PageFooter'
import { PRINT, PRINT_TYPE } from './printTokens'

export type FieldCompilationStyles = ReturnType<
  typeof createFieldCompilationStyles
>

export const createFieldCompilationStyles = () => {
  return StyleSheet.create({
    page: {
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 12,
      backgroundColor: '#ffffff',
      fontSize: 8.5,
      color: PRINT.body,
    },
    pageDate: {
      position: 'absolute',
      top: 16,
      right: 18,
      fontSize: 8.5,
      color: PRINT.body,
    },
    footer: {
      position: 'absolute',
      bottom: 8,
      left: 12,
      right: 12,
    },
    footerText: {
      fontSize: PRINT_TYPE.caption,
      color: PRINT.secondary,
    },
    header: {
      marginBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: PRINT.accent,
      paddingBottom: 9,
    },
    title: {
      fontSize: PRINT_TYPE.title,
      fontWeight: 700,
      color: PRINT.accent,
      textAlign: 'center',
    },
    headerDate: {
      fontSize: PRINT_TYPE.label,
      color: PRINT.secondary,
      textAlign: 'right',
      marginTop: 3,
    },
    content: {
      flexDirection: 'row',
      gap: 10,
    },
    leftColumn: {
      width: '57%',
      paddingRight: 2,
    },
    rightColumn: {
      width: '43%',
    },
    section: {
      // One scale only: the 8 pt body text plus the navy header bands need the
      // vertical budget, and Site Notes has to stay on page 1.
      marginBottom: 5,
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
      color: PRINT.accent,
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
      fontSize: PRINT_TYPE.section,
      fontWeight: 700,
      color: PRINT.accent,
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
      borderColor: PRINT.hairline,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: PRINT.accent,
      borderBottomWidth: 1,
      borderBottomColor: PRINT.accent,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: PRINT.hairline,
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    cell: {
      paddingVertical: 2,
      paddingHorizontal: 3,
      fontSize: PRINT_TYPE.body,
      color: PRINT.body,
      lineHeight: 1.1,
    },
    cellHeader: {
      fontWeight: 700,
      fontSize: PRINT_TYPE.body,
      color: PRINT.accentText,
      // One scale means narrow columns may wrap ("DTW Below MP (ft)" at 8 pt in
      // a 16.67 % column does); a tight leading keeps that wrap from costing a
      // second line of page height.
      lineHeight: 1.05,
      paddingVertical: 2,
      paddingHorizontal: 3,
    },
    compactCell: {
      fontSize: PRINT_TYPE.caption,
      lineHeight: 1.05,
      paddingVertical: 2,
      paddingHorizontal: 2,
      color: PRINT.body,
    },
    compactCellHeader: {
      fontSize: PRINT_TYPE.caption,
      color: PRINT.accentText,
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
      // BDMS-1504: the photo is the rightmost (col-4) child and takes the
      // outer 60% of the right column; the pad on its left is 40%.
      width: '60%',
    },
    image: {
      width: '100%',
      height: 140,
      objectFit: 'cover',
      borderWidth: 1,
      borderColor: PRINT.hairline,
      borderRadius: PRINT.radius,
    },
    imageLabel: {
      marginTop: 2,
      fontSize: PRINT_TYPE.caption,
      color: PRINT.secondary,
    },
    photoCaption: {
      marginTop: 2,
      marginBottom: 4,
      fontSize: PRINT_TYPE.caption,
      color: PRINT.secondary,
    },
    notePad: {
      // BDMS-1504: left (col-3) child, 40% of the right column; it stretches
      // to the photo frame height via imageNoteRow alignItems: stretch.
      width: '40%',
      borderWidth: 1,
      borderColor: PRINT.hairline,
      borderRadius: PRINT.radius,
      backgroundColor: '#ffffff',
    },
    notePadLine: {
      borderBottomWidth: 1,
      borderBottomColor: PRINT.hairline,
      height: 16,
    },
    preVisitPad: {
      width: '100%',
      backgroundColor: PRINT.panel,
      borderLeftWidth: 4,
      borderLeftColor: PRINT.accent,
      borderRadius: PRINT.radius,
      paddingTop: 2,
      paddingBottom: 2,
      paddingLeft: 6,
      paddingRight: 6,
    },
    ruledSlot: {
      borderWidth: 1,
      borderColor: PRINT.hairline,
      borderRadius: PRINT.radius,
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
      fontSize: PRINT_TYPE.caption,
      fontWeight: 700,
      color: PRINT.secondary,
      marginBottom: 3,
    },
    fillLine: {
      borderBottomWidth: 1,
      borderBottomColor: PRINT.secondary,
      height: 16,
    },
    cutMethodTable: {
      borderWidth: 1,
      borderColor: PRINT.hairline,
      marginTop: 4,
    },
    cutMethodTableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: PRINT.hairline,
    },
    cutMethodTableRowLast: {
      borderBottomWidth: 0,
    },
    cutMethodTableLabelCell: {
      width: '22%',
      paddingVertical: 6,
      paddingHorizontal: 6,
      fontSize: PRINT_TYPE.caption,
      fontWeight: 700,
      color: PRINT.body,
      borderRightWidth: 1,
      borderRightColor: PRINT.hairline,
    },
    cutMethodTableValueCell: {
      width: '15.6%',
      paddingTop: 4,
      paddingHorizontal: 4,
      paddingBottom: 0,
      borderRightWidth: 1,
      borderRightColor: PRINT.hairline,
    },
    cutMethodTableValueCellLast: {
      borderRightWidth: 0,
    },
    // Navy band with white text — the header treatment used by every table on
    // the owner page, applied here so the write-in grid belongs to the family.
    cutMethodTableHeaderCell: {
      width: '15.6%',
      paddingVertical: 5,
      paddingHorizontal: 4,
      fontSize: PRINT_TYPE.caption,
      fontWeight: 700,
      color: PRINT.accentText,
      backgroundColor: PRINT.accent,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: PRINT.accent,
    },
    newMeasurementBox: {
      borderWidth: 1,
      borderColor: PRINT.hairline,
      borderRadius: PRINT.radius,
      padding: 2,
      marginBottom: 2,
    },
    newMeasurementHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 1,
    },
    newMeasurementTitle: {
      fontSize: PRINT_TYPE.section,
      fontWeight: 700,
      color: PRINT.accent,
    },
    newMeasurementPrev: {
      fontSize: PRINT_TYPE.body,
      fontWeight: 700,
      color: PRINT.accent,
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
      fontSize: PRINT_TYPE.caption,
      fontWeight: 700,
      color: PRINT.secondary,
      marginBottom: 0,
    },
    // Shorter write-in line so the box stays compact on page 1 (BDMS-1504).
    newWriteLine: {
      borderBottomWidth: 1,
      borderBottomColor: PRINT.hairline,
      height: 7,
    },
    // Thin hairline grid used only for the new write-in measurement grid. Keeps
    // row/column separation without the heavy per-cell padding of cutMethod*.
    newGridRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: PRINT.hairline,
    },
    // Navy band, white caption text: the same header treatment the owner page
    // uses for its tables, so the sheet reads as one design family.
    newGridHeaderCell: {
      width: '20%',
      paddingVertical: 2,
      paddingHorizontal: 3,
      fontSize: PRINT_TYPE.caption,
      fontWeight: 700,
      color: PRINT.accentText,
      backgroundColor: PRINT.accent,
      textAlign: 'center',
      borderRightWidth: 1,
      borderRightColor: PRINT.accent,
    },
    newGridLabelCell: {
      width: '20%',
      paddingVertical: 1,
      paddingHorizontal: 3,
      fontSize: PRINT_TYPE.caption,
      fontWeight: 700,
      color: PRINT.body,
      borderRightWidth: 1,
      borderRightColor: PRINT.hairline,
    },
    newGridValueCell: {
      width: '20%',
      paddingTop: 1,
      paddingBottom: 0,
      paddingHorizontal: 2,
      borderRightWidth: 1,
      borderRightColor: PRINT.hairline,
    },
    notesPad: {
      borderWidth: 1,
      borderColor: PRINT.hairline,
      borderRadius: PRINT.radius,
      paddingTop: 2,
    },
    notesPadLine: {
      borderBottomWidth: 1,
      borderBottomColor: PRINT.hairline,
      height: 20,
    },
    blankPageBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    blankPageText: {
      fontSize: 12,
      color: PRINT.body,
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

const siteNoteColumns = [
  { key: 'date', label: 'Date', width: '20%' },
  { key: 'note', label: 'Note', width: '80%' },
] as const

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
const newMeasurementGridRows = [
  'Hold',
  'Cut',
  'DTW Below MP (ft)',
  'DTW BGS (ft)',
] as const

type TableColumn<T> = {
  key: keyof T | string
  label: string
  width: string
}

const renderValue = (value: unknown, empty = '—') => {
  if (value == null || value === '') return empty
  return String(value)
}

const formatNumeric = (
  value: number | null | undefined,
  fractionDigits = 2,
  empty = '—'
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

const splitSiteNote = (content?: string | null) => {
  const normalized = content?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return null

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})\s*:\s*(.+)$/)
  if (!match) {
    return {
      date: '-',
      sortDate: null,
      note: normalized,
    }
  }

  return {
    date: formatAppDate(match[1]),
    sortDate: new Date(`${match[1]}T12:00:00Z`).getTime(),
    note: match[2].trim() || normalized,
  }
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
  showDate = true,
  emptyPlaceholder = '—',
  notesPlacement = 'column',
  firstPageOnly = false,
  directionNotes = '',
}: {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments: SensorDeploymentRow[]
  hydrographImage?: string | null
  sampleMethodsBySampleId: Record<number, string>
  includeConfidentialContacts: boolean
  showDate?: boolean
  emptyPlaceholder?: string
  notesPlacement?: 'column'
  directionNotes?: string
  firstPageOnly?: boolean
}) => {
  const styles = useMemo(() => createFieldCompilationStyles(), [])

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
  // Page 1 draws at most PHOTO_SLOT_CAP photographs. The full filtered list is
  // kept separately because `imageAssets.length` can never exceed the cap, so a
  // caption conditioned on it would never print — the 5-photo well silently lost
  // photos 4 and 5 (Rob, GUI review 2026-10-22).
  const photoAssets = useMemo(
    () =>
      assets.filter(
        (asset: any) =>
          asset?.signed_url &&
          typeof asset?.mime_type === 'string' &&
          asset.mime_type.startsWith('image/')
      ),
    [assets]
  )
  const imageAssets = useMemo(
    () => photoAssets.slice(0, PHOTO_SLOT_CAP),
    [photoAssets]
  )
  const { easting, northing } =
    well.current_location?.properties?.utm_coordinates ?? {}
  const exportDate = formatAppDate(new Date().toISOString())
  // Page 1 prints empty fields on the mock-up; '-' would read as data.
  const show = (value: unknown) => renderValue(value, emptyPlaceholder)
  const num = (value: number | null | undefined, fractionDigits = 2) =>
    formatNumeric(value, fractionDigits, emptyPlaceholder)
  const slotPlan = fieldSheetSlotPlan(photoAssets.length)
  const ruledLines = (keyPrefix: string, count: number) =>
    Array.from({ length: count }).map((_, index) => (
      <View key={`${keyPrefix}-line-${index}`} style={styles.notePadLine} />
    ))
  const siteNoteItems = [...(well.site_notes ?? well.notes ?? [])]
    .filter(Boolean)
    .map((note) => ({
      parsed: splitSiteNote(note?.content),
      createdAt: note?.created_at ? new Date(note.created_at).getTime() : 0,
    }))
    .filter(
      (
        value
      ): value is {
        parsed: { date: string; note: string; sortDate: number | null }
        createdAt: number
      } => Boolean(value.parsed)
    )
    .sort((a, b) => {
      const aTime = a.parsed.sortDate ?? a.createdAt
      const bTime = b.parsed.sortDate ?? b.createdAt
      return bTime - aTime
    })
    .map((value) => ({
      date: value.parsed.date,
      note: value.parsed.note,
    }))
    .slice(0, 2)

  return (
    <>
      <Page size="LETTER" style={styles.page}>
        <PageFooter
          wellId={well.name}
          pageNumber={1}
          totalPages={firstPageOnly ? 1 : 2}
          styles={styles}
        />
        {showDate ? <Text style={styles.pageDate}>{exportDate}</Text> : null}
        <View style={styles.header}>
          <Text style={styles.title}>Field Compilation Notes</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.leftColumn}>
            <View style={styles.topGrid}>
              <View style={styles.topGridColumn}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Point ID: </Text>
                  {show(well.name)}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Site Name: </Text>
                  {siteNameFromAlternateIds(well)}
                </Text>
              </View>
              <View style={styles.topGridColumn}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Easting: </Text>
                  {num(easting, 0)}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Northing: </Text>
                  {num(northing, 0)}
                </Text>
              </View>
            </View>

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
                    <Text style={styles.label}>Phone: </Text>
                    {formatContactPhones(primaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Address: </Text>
                    {contactAddress(primaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Email: </Text>
                    {contactEmail(primaryContact)}
                  </Text>
                </View>
                <View style={[styles.contactColumn, styles.contactDetails]}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Phone: </Text>
                    {formatContactPhones(secondaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Address: </Text>
                    {contactAddress(secondaryContact)}
                  </Text>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Email: </Text>
                    {contactEmail(secondaryContact)}
                  </Text>
                </View>
              </View>
            </View>

            <NoteSection
              styles={styles}
              title="Location Notes"
              value={locationNotesText(well)}
            />
            {/* Source open (BDMS-1509 Q17): display only. No parsing, no
                inference — the string is supplied by the caller and never
                derived from any other well field. */}
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

            <View style={styles.section}>
              <View style={styles.metricRow}>
                <View style={styles.metricCell}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>MP Height: </Text>
                    {`${num(well.measuring_point_height)} ${well.measuring_point_height_unit ?? ''}`.trim()}
                  </Text>
                </View>
                <View style={styles.metricCell}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Well Depth: </Text>
                    {`${num(well.well_depth)} ${well.well_depth_unit ?? ''}`.trim()}
                  </Text>
                </View>
              </View>
            </View>

            {/* ALIGNMENT A5: a labelled write-on box the field hand fills in
                before taking the reading. Ruled, not text — nothing prints
                here from the database. */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pre-visit Notes</Text>
              <View style={styles.preVisitPad}>
                {ruledLines('previsit', 3)}
              </View>
            </View>

            <PdfTable
              styles={styles}
              title="Last Measurements"
              columns={lastMeasurementsColumns}
              rows={measurements}
              compact
            />
            {/* BDMS-1504 lane11: a write-in box for a new field reading, placed
                after the Last Measurements table and before Installed Equipment.
                The previous-reading callout reuses the newest row the Last
                Measurements table already renders (measurements[0]); when there
                is no reading the callout is omitted entirely — no label, no
                dash. No tape/MP correction props reach this component, so the
                corrections line is omitted rather than invented. */}
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
                  <Text style={styles.newMeasurementFieldLabel}>Date: </Text>
                  {showDate ? (
                    <Text style={styles.newMeasurementFieldLabel}>
                      {exportDate}
                    </Text>
                  ) : (
                    <View style={styles.newWriteLine} />
                  )}
                </View>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>Time: </Text>
                  <View style={styles.newWriteLine} />
                </View>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>Staff: </Text>
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
                  <Text style={styles.newMeasurementFieldLabel}>Method: </Text>
                  <View style={styles.fillLine} />
                </View>
              </View>
              <View style={styles.newMeasurementFieldRow}>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Level Status:{' '}
                  </Text>
                  <View style={styles.fillLine} />
                </View>
              </View>
              <View style={styles.newMeasurementFieldRow}>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>Notes: </Text>
                  <View style={styles.fillLine} />
                </View>
              </View>
            </View>
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
            <PdfTable
              styles={styles}
              title="Site Notes"
              columns={siteNoteColumns}
              rows={siteNoteItems}
              compact
            />
          </View>

          <View style={styles.rightColumn}>
            {photoAssets.slice(0, slotPlan.photos).map((asset: any) => (
              <View
                key={asset.id ?? asset.signed_url}
                style={styles.imageNoteRow}
              >
                {/* BDMS-1504: the ruled pad is now the left (col-3) child and
                    the photograph the rightmost (col-4) child. imageNoteRow
                    alignItems: stretch makes the pad match the frame height. */}
                <View style={styles.notePad}>
                  {ruledLines('photo', FIELD_SHEET_NOTE_LINES)}
                </View>
                <View style={styles.imageWrap}>
                  <Image
                    src={asset.signed_url}
                    style={[
                      styles.image,
                      {
                        // Photo frame height comes from the column height
                        // budget (fieldSheetSlotPlan); it shrinks only when five
                        // frames alone overrun the 700pt column.
                        height: slotPlan.frameHeight,
                      },
                    ]}
                  />
                  <Text style={styles.imageLabel}>
                    {asset.label || asset.name || ''}
                  </Text>
                </View>
              </View>
            ))}
            {photoAssets.length > slotPlan.photos ? (
              <Text style={styles.photoCaption}>
                top {slotPlan.photos} photos shown
              </Text>
            ) : null}
            {Array.from({ length: slotPlan.ruled }).map((_, index) => (
              <View key={`ruled-${index}`} style={styles.ruledSlot}>
                {ruledLines(`ruled-${index}`, FIELD_SHEET_RULED_LINES)}
              </View>
            ))}
            {slotPlan.tailLines > 0 ? (
              <View style={styles.ruledSlot}>
                {ruledLines('tail', slotPlan.tailLines)}
              </View>
            ) : null}
          </View>
        </View>
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
  showDate = true,
  emptyPlaceholder = '—',
  notesPlacement = 'column',
  firstPageOnly = false,
  directionNotes = '',
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
  showDate?: boolean
  emptyPlaceholder?: string
  notesPlacement?: 'column'
  directionNotes?: string
  firstPageOnly?: boolean
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
      showDate={showDate}
      emptyPlaceholder={emptyPlaceholder}
      notesPlacement={notesPlacement}
      firstPageOnly={firstPageOnly}
      directionNotes={directionNotes}
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
