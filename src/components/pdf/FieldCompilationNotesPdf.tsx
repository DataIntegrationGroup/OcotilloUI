import { useMemo } from 'react'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { BaseRecord } from '@refinedev/core'
import type { IContact, IObservation, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'
import {
  buildPdfFilename,
  formatAddress,
  formatAppDate,
  sanitizeContacts,
} from '@/utils'
import { usePrimaryAndSecondaryContact } from '@/hooks'
import { formatContactPhones } from './fieldCompilationPhoneFormatter'

const styles = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    fontSize: 9,
    color: '#111827',
  },
  pageDate: {
    position: 'absolute',
    top: 16,
    right: 20,
    fontSize: 9,
    color: '#111827',
  },
  header: {
    marginBottom: 8,
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
  leftColumn: {
    width: '57%',
    paddingRight: 2,
  },
  rightColumn: {
    width: '43%',
  },
  section: {
    marginBottom: 7,
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
    height: 16,
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

const lastMeasurementsColumns = [
  { key: 'date', label: 'Date', width: '20%' },
  { key: 'dtw', label: 'DTW (ft)', width: '20%' },
  { key: 'mpHeight', label: 'MP Ht (ft)', width: '14%' },
  { key: 'method', label: 'Method', width: '18%' },
  { key: 'status', label: 'Level Status', width: '28%' },
] as const

const equipmentColumns = [
  { key: 'sensor_type', label: 'Equipment Type', width: '20%' },
  { key: 'sensor_model', label: 'Model', width: '14%' },
  { key: 'serial_no', label: 'Serial No', width: '16%' },
  { key: 'hanging_cable_length', label: 'Cable Length', width: '14%' },
  { key: 'recording_interval_display', label: 'Rec Interval', width: '16%' },
  { key: 'datetime_installed', label: 'Installed', width: '20%' },
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

const equipmentNoteColumns = [
  { key: 'note', label: 'Note', width: '100%' },
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

type TableColumn<T> = {
  key: keyof T | string
  label: string
  width: string
}

const renderValue = (value: unknown) => {
  if (value == null || value === '') return '-'
  return String(value)
}

const formatNumeric = (
  value: number | null | undefined,
  fractionDigits = 2
): string => {
  if (value == null || Number.isNaN(value)) return '-'
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
  notes: Array<{ content?: string | null; created_at?: string | null } | null | undefined>,
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
      note?.content
        ?.replace(/\s+/g, options?.compact ? ' ' : ' ')
        .trim()
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

const equipmentNoteRows = (rows: SensorDeploymentRow[]) => {
  const notes = rows
    .map((row) => row.notes?.trim())
    .filter((note): note is string => Boolean(note && note !== '-'))

  const uniqueNotes = Array.from(new Set(notes))

  return uniqueNotes.length > 0
    ? uniqueNotes.map((note) => ({ note }))
    : [{ note: '-' }]
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
      status: observation.groundwater_level_reason ?? observation.level_status ?? '-',
    }))

const manualMeasurementRows = (observations: readonly Partial<IObservation>[]) =>
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
      status: observation.groundwater_level_reason ?? observation.level_status ?? '-',
    }))

const PdfTable = <T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  compact = false,
}: {
  title: string
  columns: readonly TableColumn<T>[]
  rows: T[]
  compact?: boolean
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
              compact ? styles.compactCellHeader : null,
              { width: column.width },
            ]}
          >
            {column.label}
          </Text>
        ))}
      </View>
      {(rows.length > 0 ? rows : [Object.create(null) as T]).map((row, rowIndex, arr) => (
        <View
          key={rowIndex}
          style={[
            styles.tableRow,
            rowIndex === arr.length - 1 ? styles.tableRowLast : null,
          ]}
        >
          {columns.map((column) => (
            <Text
              key={column.label}
              style={[
                styles.cell,
                compact ? styles.compactCell : null,
                { width: column.width },
              ]}
            >
              {rows.length > 0
                ? renderValue(row[column.key as keyof T])
                : '-'}
            </Text>
          ))}
        </View>
      ))}
    </View>
  </View>
)

const NoteSection = ({
  title,
  value,
}: {
  title: string
  value: string
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
}: {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments: SensorDeploymentRow[]
  hydrographImage?: string | null
  sampleMethodsBySampleId: Record<number, string>
  includeConfidentialContacts: boolean
}) => {
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
    () =>
      assets
        .filter(
          (asset: any) =>
            asset?.signed_url &&
            typeof asset?.mime_type === 'string' &&
            asset.mime_type.startsWith('image/')
        )
        .slice(0, 3),
    [assets]
  )
  const { easting, northing } =
    well.current_location?.properties?.utm_coordinates ?? {}
  const exportDate = formatAppDate(new Date().toISOString())
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
        <Text style={styles.pageDate}>{exportDate}</Text>
        <View style={styles.header}>
          <Text style={styles.title}>Field Compilation Notes</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.leftColumn}>
            <View style={styles.topGrid}>
              <View style={styles.topGridColumn}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Point ID: </Text>
                  {renderValue(well.name)}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Site Name: </Text>
                  {siteNameFromAlternateIds(well)}
                </Text>
              </View>
              <View style={styles.topGridColumn}>
                <Text style={styles.line}>
                  <Text style={styles.label}>Easting: </Text>
                  {easting != null ? formatNumeric(easting, 0) : '-'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Northing: </Text>
                  {northing != null ? formatNumeric(northing, 0) : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.contactsRow}>
                <View style={styles.contactColumn}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Primary Contact: </Text>
                    {renderValue(primaryContact?.name)}
                  </Text>
                </View>
                <View style={styles.contactColumn}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Secondary Contact: </Text>
                    {renderValue(secondaryContact?.name)}
                  </Text>
                </View>
              </View>
              <View style={styles.contactsRow}>
                <View style={[styles.contactColumn, styles.contactDetails]}>
                  <Text style={styles.line}>{contactAddress(primaryContact)}</Text>
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

            <NoteSection title="Location Notes" value={locationNotesText(well)} />
            <NoteSection
              title="Measurement Notes"
              value={notesToText(well.measuring_notes ?? [])}
            />
            <NoteSection
              title="Measuring Point Description"
              value={well.measuring_point_description?.trim() || '-'}
            />

            <View style={styles.section}>
              <View style={styles.metricRow}>
                <View style={styles.metricCell}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>MP Height: </Text>
                    {well.measuring_point_height != null
                      ? `${formatNumeric(well.measuring_point_height)} ${well.measuring_point_height_unit ?? ''}`.trim()
                      : '-'}
                  </Text>
                </View>
                <View style={styles.metricCell}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Well Depth: </Text>
                    {well.well_depth != null
                      ? `${formatNumeric(well.well_depth)} ${well.well_depth_unit ?? ''}`.trim()
                      : '-'}
                  </Text>
                </View>
              </View>
            </View>

            <PdfTable
              title="Last Measurements"
              columns={lastMeasurementsColumns}
              rows={measurements}
              compact
            />
            <PdfTable
              title="Equipment"
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
                  recording_interval_display: row.recording_interval_display ?? '-',
                  datetime_installed: formatAppDate(row.datetime_installed),
                }))}
              compact
            />
            <PdfTable
              title="Equipment Notes"
              columns={equipmentNoteColumns}
              rows={equipmentNoteRows(sensorDeployments)}
              compact
            />
            <PdfTable
              title="Site Notes"
              columns={siteNoteColumns}
              rows={siteNoteItems}
              compact
            />
          </View>

          <View style={styles.rightColumn}>
            {imageAssets.length > 0 ? (
              imageAssets.map((asset: any) => (
                <View
                  key={asset.id ?? asset.signed_url}
                  style={styles.imageNoteRow}
                >
                  <View style={styles.imageWrap}>
                    <Image src={asset.signed_url} style={styles.image} />
                    <Text style={styles.imageLabel}>
                      {asset.label || asset.name || ''}
                    </Text>
                  </View>
                  <View style={styles.notePad}>
                    {Array.from({ length: 8 }).map((_, index) => (
                      <View key={index} style={styles.notePadLine} />
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyImageState}>No site images available.</Text>
            )}
          </View>
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.pageDate}>{exportDate}</Text>
        <Text style={styles.pageTitle}>General Field Notes: {well.name}</Text>
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
                    index === cutMethodColumns.length - 1
                      ? styles.cutMethodTableValueCellLast
                      : null,
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
                  rowIndex === cutMethodRows.length - 1
                    ? styles.cutMethodTableRowLast
                    : null,
                ]}
              >
                <Text style={styles.cutMethodTableLabelCell}>{rowLabel}</Text>
                {cutMethodColumns.map((column, index) => (
                  <View
                    key={`${rowLabel}-${column}`}
                    style={[
                      styles.cutMethodTableValueCell,
                      index === cutMethodColumns.length - 1
                        ? styles.cutMethodTableValueCellLast
                        : null,
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
            <View key={`general-note-line-${index}`} style={styles.notesPadLine} />
          ))}
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.pageDate}>{exportDate}</Text>
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
          title="Manual Measurements"
          columns={manualMeasurementColumns}
          rows={manualMeasurements}
        />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.pageDate}>{exportDate}</Text>
        <View style={styles.blankPageBody}>
          <Text style={styles.blankPageText}>
            This page is intentionally left blank
          </Text>
        </View>
      </Page>
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
