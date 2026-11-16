import {
  Image,
  Page,
  Text,
  View,
} from '@react-pdf/renderer'
import type { BaseRecord } from '@refinedev/core'
import type { ReactElement } from 'react'
import { usePrimaryAndSecondaryContact } from '@/hooks/usePrimaryAndSecondaryContact'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import type { SensorDeploymentRow } from '@/utils'
import { formatAddress, formatAppDate } from '@/utils'
import {
  FIELD_SHEET_NOTE_LINES,
  FIELD_SHEET_RULED_LINES,
  PHOTO_SLOT_CAP,
} from '../../fieldSheetPageLayout'
import { formatContactPhones } from '../../fieldCompilationPhoneFormatter'
import { PageFooter } from '../../layout/PageFooter'
import { PdfTable } from '../../layout/PdfTable'
import NoteSection from '../../primitives/NoteSection'
import type { FieldCompilationStyles } from '../styles'
import {
  contactAddress,
  contactEmail,
  equipmentNotesText,
  formatElevation,
  formatNumeric,
  locationNotesText,
  notesToText,
  renderValue,
  siteNameFromAlternateIds,
  siteNotesText,
  directionNotesValue,
} from '../format'
import {
  equipmentColumns,
  lastMeasurementsColumns,
  siteNotesFieldLabel,
} from '../tables'

// ── Inline column definitions for the new Measurement tables ──

const newMeasurementColumns = [
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'staff', label: 'Staff' },
  { key: 'prevDtw', label: 'Prev DTW (ft)' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Level Status' },
] as const

const measurementGridColumns = [
  { key: 'measurement', label: 'Measurement' },
  { key: 'm1', label: 'M1' },
  { key: 'm2', label: 'M2' },
  { key: 'm3', label: 'M3' },
  { key: 'm4', label: 'M4' },
  { key: 'm5', label: 'M5' },
] as const

// ── Inline row definitions for the M1–M5 write-in grid ──

type MeasurementGridRow = {
  measurement: string
  m1: string
  m2: string
  m3: string
  m4: string
  m5: string
}

const measurementGridRows: MeasurementGridRow[] = [
  { measurement: 'Time', m1: '', m2: '', m3: '', m4: '', m5: '' },
  { measurement: 'Hold', m1: '', m2: '', m3: '', m4: '', m5: '' },
  { measurement: 'Cut', m1: '', m2: '', m3: '', m4: '', m5: '' },
  { measurement: 'Tape Correction', m1: '', m2: '', m3: '', m4: '', m5: '' },
  { measurement: 'WL below MP', m1: '', m2: '', m3: '', m4: '', m5: '' },
  { measurement: 'MP Correction', m1: '', m2: '', m3: '', m4: '', m5: '' },
]

// Page 1 of the field compilation packet. JSX moved verbatim out of
// page.tsx 195-639 (C2b); the <Page> element wrapping it is the original.
export function IdentityPage({
  well,
  sensorDeployments,
  includeAssets,
  styles,
  accentBarHeight,
  primaryContact,
  secondaryContact,
  measurements,
  imageAssets,
  easting,
  northing,
  exportDate,
  renderPageDate,
  show,
  num,
  ruledLines,
  showDate,
  emptyPlaceholder,
  firstPageOnly,
  showPhotos,
  notesPlacement,
  directionNotes,
}: {
  well: IWell;
  sensorDeployments: SensorDeploymentRow[];
  includeAssets: boolean;
  styles: FieldCompilationStyles;
  accentBarHeight: number;
  primaryContact: IContact | undefined;
  secondaryContact: IContact | undefined;
  measurements: ReturnType<typeof import("../format").lastMeasurementsRows>;
  imageAssets: BaseRecord[];
  easting: number | null | undefined;
  northing: number | null | undefined;
  exportDate: string;
  renderPageDate: () => ReactElement;
  show: typeof renderValue;
  num: typeof formatNumeric;
  ruledLines: (keyPrefix: string, count: number) => ReactElement[];
  showDate: boolean;
  emptyPlaceholder: string;
  firstPageOnly: boolean;
  showPhotos: boolean;
  notesPlacement: 'column' | 'top';
  directionNotes: string,
}): ReactElement {
  return (
      <Page size="LETTER" style={styles.page}>
        <PageFooter wellId={well.name} pageNumber={1} styles={styles} totalPages={firstPageOnly ? 1 : 2} />
        {showDate ? renderPageDate() : null}
        <View style={styles.pageFrame}>
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
                  <Text style={styles.line} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Elevation: </Text>{formatElevation(well.current_location?.properties)}
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
              </View>
              <NoteSection
                styles={styles}
                title="Direction notes"
                value={directionNotesValue(directionNotes)}
                accentBarHeight={accentBarHeight}
              />
              <NoteSection
                styles={styles}
                title="MP Description"
                value={
                  well.measuring_point_description?.trim() || ''
                }
                accentBarHeight={accentBarHeight}
              />
              <View style={styles.rowRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>MP Height: </Text>
                    {`${num(well.measuring_point_height)} ${well.measuring_point_height_unit ?? ''}`.trim()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Well Depth: </Text>
                    {`${num(well.well_depth)} ${well.well_depth_unit ?? ''}`.trim()}
                  </Text>
                </View>
              </View>
            </View>



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

            {/* Row 5: Today's Measurement table */}
            <>
              <PdfTable
                styles={styles}
                title="Today's Measurement"
                columns={lastMeasurementsColumns}
                rows={measurements.slice(0, 1).map((row) => row)}
                compact
                accentBarHeight={accentBarHeight}
              />
              <View style={{ marginTop: 2, paddingHorizontal: 4, paddingVertical: 3, borderWidth: 1, borderTopWidth: 0, borderColor: 'transparent' }}>
                <Text style={{}}>
                  <Text style={{ fontWeight: 'bold' }}>{siteNotesFieldLabel} </Text>
                  {siteNotesText(well)}
                </Text>
              </View>
            </>
          </View>
          {/* ── End contentColumn (top block only) ─────────────────── */}

          {/* ── Photo column (33.33%, persistent right strip) ──────── */}
          {showPhotos && includeAssets && (
          <View style={styles.photoColumn}>
            {imageAssets.slice(0, PHOTO_SLOT_CAP).map((asset: any) => (
              <View key={asset.id ?? asset.signed_url} style={styles.photoCell}>
                <View style={styles.imageWrap}>
                  <Image src={asset.signed_url} style={styles.image} />
                  <Text style={styles.imageLabel}>
                    {asset.label || asset.name || ''}
                  </Text>
                </View>
              </View>
            ))}
            {/* PR #428 item 1: with one or two photos the strip keeps the empty
                slots as dashed frames captioned "No photo", so a tech can see
                how many more photos the sheet expects. */}
            {Array.from({
              length: Math.max(0, PHOTO_SLOT_CAP - imageAssets.length),
            }).map((_, slot) => (
              <View key={`photo-slot-empty-${slot}`} style={styles.photoCell}>
                <View style={styles.imageWrap}>
                  <View style={styles.photoSlotPlaceholder} />
                  <Text style={styles.imageLabel}>No photo</Text>
                </View>
              </View>
            ))}
          </View>
          )}
          {/* ── End photo column ───────────────────────────────────── */}
        </View>
        {/* ── End columnContainer (top row: content + photos) ─── */}

        {/* ── Full-width block below top row (Rows 6–7 + Notes) ── */}
        <View style={{ width: '100%' }}>
          {/* Row 6: Installed Equipment */}
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
                    : '',
                recording_interval_display:
                  row.recording_interval_display ?? '',
                datetime_installed: formatAppDate(row.datetime_installed),
                notes: row.notes?.trim() || '',
              }))}
            compact
          />

          {/* Row 7: New Measurement — two PdfTables + notes */}
          {/* Table A: one-row data entry (Date pre-filled) */}
          <PdfTable
            styles={styles}
            title="New Measurement"
            columns={newMeasurementColumns}
            rows={[{
              date: showDate ? exportDate : '',
              time: '',
              staff: '',
              prevDtw: '',
              method: '',
              status: '',
            }]}
            accentBarHeight={accentBarHeight}
          />

          {/* Table B: M1–M5 write-in grid */}
          <PdfTable
            styles={styles}
            title=""
            columns={measurementGridColumns}
            rows={measurementGridRows}
            accentBarHeight={0}
          />

          {/* Notes: three stacked fill lines, each prefixed with a visible "Notes:" label */}
          <View style={styles.notesLineStack}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <View key={`note-row-${idx}`} style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={[styles.label, { marginRight: 2 }]}>Notes: </Text>
                <View style={[styles.fillLine, { flexGrow: 1 }]} />
              </View>
            ))}
          </View>
        </View>
        {/* ── End full-width block (Rows 6–7 + Notes) ───── */}
      </View>
      {/* ── End pageFrame ─────────────────────────────────────────── */}
      </Page>
  )
}
