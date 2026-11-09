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
  formatNumeric,
  locationNotesText,
  lastTwoSiteNotes,
  notesToText,
  renderValue,
  siteNameFromAlternateIds,
  siteNotesText,
  directionNotesValue,
} from '../format'
import {
  cutMethodColumns,
  equipmentColumns,
  lastMeasurementsColumns,
  newMeasurementGridRows,
  siteNotesFieldLabel,
} from '../tables'

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
                  <Text style={styles.line} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.line}>
                    <Text style={styles.label}>Elevation: </Text>
                    {num(well.current_location?.properties?.elevation, 0)}
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
                  well.measuring_point_description?.trim() || emptyPlaceholder
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

            {/* Pre-visit Notes — moved below Field Notes */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleBar}>
                <View
                  style={[
                    styles.accentBar,
                    { height: accentBarHeight },
                  ]}
                />
                <Text style={styles.sectionTitle}>Pre-visit Notes</Text>
              </View>
              <View style={styles.preVisitPad}>
                {ruledLines('previsit', 3)}
              </View>
            </View>

            {/* ── Rows: flex columns that flow into content width ─── */}

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
                title="Measurement Notes"
                value={notesToText(well.measuring_notes ?? [])}
                accentBarHeight={accentBarHeight}
              />
            </View>


            {/* Row 5: Previous Measurements table */}
            {(() => {
              // Last two site notes, newest-first — one per measurement row so
              // the newest note lands on the newest row (lastMeasurementsRows is
              // already sorted desc by datetime). Fewer notes than rows leaves
              // the extra cells blank.
              const notes = lastTwoSiteNotes(well)
              return (
                <PdfTable
                  styles={styles}
                  title="Previous Measurements"
                  columns={lastMeasurementsColumns}
                  rows={measurements.map((row, i) => ({
                    ...row,
                    siteNotes: notes[i] ?? '',
                  }))}
                  compact
                  accentBarHeight={accentBarHeight}
                />
              )
            })()}

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
                        <Text style={styles.sectionTitle}>Previous DTW below MP</Text>
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

            {/* ── End content column ─────────────────────────────────── */}
          </View>

          {/* ── Photo column (33.33%, persistent right strip) ──────── */}
          {showPhotos && includeAssets && imageAssets.length > 0 && (
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
          </View>
          )}
          {/* ── End photo column ───────────────────────────────────── */}
        </View>
        {/* ── End columnContainer ──────────────────────────────────────── */}
      </Page>
  )
}
