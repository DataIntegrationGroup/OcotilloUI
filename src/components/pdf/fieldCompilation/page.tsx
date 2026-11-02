import {
  Document,
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
  newMeasurementGridRows,
  siteNotesFieldLabel,
} from './tables'


// ── Imported helper components ──
export type { TableColumn } from '../layout/PdfTable'
import { IdentityPage } from './pages/IdentityPage'
import { GeneralNotesPage } from './pages/GeneralNotesPage'
import { HydrographMeasurementsPage } from './pages/HydrographMeasurementsPage'
import { BlankPage } from './pages/BlankPage'

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
          <GeneralNotesPage
            well={well}
            styles={styles}
            accentBarHeight={accentBarHeight}
            renderPageDate={renderPageDate}
            showDate={showDate}
          />

          <HydrographMeasurementsPage
            well={well}
            styles={styles}
            renderPageDate={renderPageDate}
            showDate={showDate}
            hydrographImage={hydrographImage}
            manualMeasurements={manualMeasurements}
          />

          <BlankPage
            styles={styles}
            renderPageDate={renderPageDate}
            showDate={showDate}
          />
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
