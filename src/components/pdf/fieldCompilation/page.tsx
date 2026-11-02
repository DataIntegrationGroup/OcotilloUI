import {
  Document,
  Image,
  Page,
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
import { PHOTO_SLOT_CAP } from '../fieldSheetPageLayout'
import { formatContactPhones } from '../fieldCompilationPhoneFormatter'
import { PageFooter } from '../layout/PageFooter'
import {
  FIELD_SHEET_NOTE_LINES,
  FIELD_SHEET_RULED_LINES,
  fieldSheetSlotPlan,
} from '../fieldSheetPageLayout'
import { createFieldCompilationStyles } from './styles'
import type { FieldCompilationStyles } from './styles'
import {
  renderValue,
  formatNumeric,
  notesToText,
  siteNameFromAlternateIds,
  locationNotesText,
  contactEmail,
  contactAddress,
  equipmentNotesText,
  siteNotesText,
  lastMeasurementsRows,
  manualMeasurementRows,
} from './format'

import { directionNotesValue } from './format'
export { directionNotesValue }

// ── Column definitions (used by PdfTable — may be extracted further in Step 4) ──

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

const newMeasurementGridRows = ['Hold', 'Cut', 'DTW Below MP (ft)', 'DTW BGS (ft)'] as const

// ── Imported helper components ──
import { PdfTable } from './table'
export type { TableColumn } from './table'
const NoteSection = ({
  title,
  value,
  styles,
  accentBarHeight = 9,
}: {
  title: string
  value: string
  styles: FieldCompilationStyles
  accentBarHeight?: number
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionTitleBar}>
      <View style={[styles.accentBar, { height: accentBarHeight }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.noteText}>{value}</Text>
  </View>
)

export const FieldCompilationNotesPage = ({
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
  showPhotos = true,
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
  showPhotos?: boolean
}) => {
  const styles = useMemo(() => createFieldCompilationStyles(density), [density])
  // Accent bar height matches the section title fontSize (9 standard).
  // Density-aware: compact uses 8.5, everything else uses 9.
  const accentBarHeight = density === 'compact' ? 8.5 : 9

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
  const renderPageDate = () => <Text style={styles.pageDate}>{exportDate}</Text>
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
        <PageFooter wellId={well.name} styles={styles} totalPages={firstPageOnly ? 1 : 4} />
        {showDate ? renderPageDate() : null}
        <View style={styles.header}>
          <Text style={styles.title}>Field Compilation Notes</Text>
        </View>
        {/* Lane 33 column model: 66.7% content (flex 2) + 33.3% photo strip (flex 1) */}
        <View style={[styles.columnContainer, { flexDirection: showPhotos ? 'row' : 'column' }]}>
          {/* ── Content column (60%) ──────────────────────────────── */}
          <View
            style={[
              styles.contentColumn,
              // Only share width with the strip in row mode. In column mode a
              // zero-basis flex child of an auto-height column collapses to 0
              // and its sections overlap — let it size to its content instead.
              showPhotos
                ? { flex: 2 }
                : { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
            ]}
          >
            {notesPlacement === 'top' ? (
              <View style={styles.section}>
                <View style={styles.sectionTitleBar}>
                  <View
                    style={[
                      styles.accentBar,
                      { height: accentBarHeight },
                    ]}
                  />
                  <Text style={styles.sectionTitle}>Field Notes</Text>
                </View>
                <View style={styles.notePad}>
                  {ruledLines('top', 4)}
                </View>
              </View>
            ) : null}

            {/* ── Row 1: 2-inner-column identity grid ─────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleBar}>
                <View
                  style={[
                    styles.accentBar,
                    { height: accentBarHeight },
                  ]}
                />
                <Text style={styles.sectionTitle}>Field Notes</Text>
              </View>
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
            </View>

            {/* ── Rows 2–7: flex columns that flow into content width ─── */}

            {/* Row 2: Contact details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleBar}>
                <View
                  style={[
                    styles.accentBar,
                    { height: accentBarHeight },
                  ]}
                />
                <Text style={styles.sectionTitle}>Contact Details</Text>
              </View>
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

            {/* Row 3: Observation */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleBar}>
                <View
                  style={[
                    styles.accentBar,
                    { height: accentBarHeight },
                  ]}
                />
                <Text style={styles.sectionTitle}>Observation</Text>
              </View>
              <NoteSection
                styles={styles}
                title="Direction notes"
                value={directionNotesValue(directionNotes)}
                accentBarHeight={accentBarHeight}
              />
              <NoteSection
                styles={styles}
                title="Measurement Notes"
                value={notesToText(well.measuring_notes ?? [])}
                accentBarHeight={accentBarHeight}
              />
              <NoteSection
                styles={styles}
                title="MP Description"
                value={
                  well.measuring_point_description?.trim() || emptyPlaceholder
                }
                accentBarHeight={accentBarHeight}
              />
            </View>

            {/* Row 4: Site Preparation */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleBar}>
                <View
                  style={[
                    styles.accentBar,
                    { height: accentBarHeight },
                  ]}
                />
                <Text style={styles.sectionTitle}>Site Preparation</Text>
              </View>
              <View style={styles.preVisitPad}>
                {ruledLines('previsit', 3)}
              </View>
            </View>

            {/* Row 5: Previous Measurements table */}
            <PdfTable
              styles={styles}
              title="Previous Measurements"
              columns={lastMeasurementsColumns}
              rows={measurements}
              compact
              accentBarHeight={accentBarHeight}
            />

            {/* Row 5b: New Measurement write-in box */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleBar}>
                <View
                  style={[
                    styles.accentBar,
                    { height: accentBarHeight },
                  ]}
                />
                <Text style={styles.sectionTitle}>New Measurement</Text>
              </View>
              <View style={styles.newMeasurementBox}>
                <View style={styles.newMeasurementHeaderRow}>
                  <Text style={styles.newMeasurementTitle}>New Measurement</Text>
                  {measurements[0] ? (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionTitleBar}>
                        <View
                          style={[
                            styles.accentBar,
                            { height: accentBarHeight },
                          ]}
                        />
                        <Text style={styles.sectionTitle}>Previous DTW</Text>
                      </View>
                      <View style={styles.newMeasurementHeaderRow}>
                        <Text style={styles.newMeasurementFieldLabel}>
                          {measurements[0].dtw} ft
                        </Text>
                        <Text style={styles.newMeasurementFieldLabel}>
                          {measurements[0].date}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
                <View style={styles.newMeasurementFieldRow}>
                <View style={styles.newMeasurementField}>
                  <Text style={styles.newMeasurementFieldLabel}>
                    Date: {showDate ? exportDate : ''}
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
            </View>

            {/* Row 6: Installed Equipment table */}
            <PdfTable
              styles={styles}
              title="Installed Equipment"
              columns={equipmentColumns}
              accentBarHeight={accentBarHeight}
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
              return (
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
              )
            })()}
          </View>
          {/* ── End content column ─────────────────────────────────── */}

          {/* ── Photo column (33.33%, persistent right strip) ──────── */}
          {showPhotos && includeAssets && imageAssets.length > 0 && (
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
              renderPageDate()
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
            {/* General Field Notes — page 2 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleBar}>
                <View
                  style={[
                    styles.accentBar,
                    { height: accentBarHeight },
                  ]}
                />
                <Text style={styles.sectionTitle}>General Field Notes</Text>
              </View>
              <View style={styles.notesPad}>
              {Array.from({ length: 20 }).map((_, index) => (
                <View
                  key={`general-note-line-${index}`}
                  style={styles.notesPadLine}
                />
              ))}
              </View>
            </View>
          </Page>

          <Page size="LETTER" style={styles.page}>
            {showDate ? (
              renderPageDate()
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
              renderPageDate()
            ) : null}
            <View style={styles.blankPageBody}>
              <Text style={styles.blankPageText}>
                This page is intentionally left blank
              </Text>
            </View>
          </Page>
        </>
      )}
      {/* TODO: QR code — render as <Image source={qrUri} style={{width:50,height:50}}/> 
          inside the Row 8 footer section, right-aligned */}
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
  showPhotos = true,
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
  showPhotos?: boolean
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
      showPhotos={showPhotos}
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
