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

import {
  cutMethodColumns,
  cutMethodRows,
  equipmentColumns,
  lastMeasurementsColumns,
  manualMeasurementColumns,
  newMeasurementGridRows,
  siteNotesFieldLabel,
} from './tables'


// ── Imported helper components ──
import { PdfTable } from '../layout/PdfTable'
export type { TableColumn } from '../layout/PdfTable'
import NoteSection from '../primitives/NoteSection'
import { IdentityPage } from './pages/IdentityPage'

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
      <IdentityPage
        well={well}
        sensorDeployments={sensorDeployments}
        includeAssets={includeAssets}
        styles={styles}
        accentBarHeight={accentBarHeight}
        primaryContact={primaryContact}
        secondaryContact={secondaryContact}
        measurements={measurements}
        imageAssets={imageAssets}
        easting={easting}
        northing={northing}
        exportDate={exportDate}
        renderPageDate={renderPageDate}
        show={show}
        num={num}
        ruledLines={ruledLines}
        showDate={showDate}
        emptyPlaceholder={emptyPlaceholder}
        firstPageOnly={firstPageOnly}
        showPhotos={showPhotos}
        notesPlacement={notesPlacement}
        directionNotes={directionNotes}
      />

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
