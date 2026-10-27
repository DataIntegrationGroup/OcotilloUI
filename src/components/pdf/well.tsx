import { useMemo } from 'react'
import { BaseRecord } from '@refinedev/core'
import { Page, Text, Image, View } from '@react-pdf/renderer'
import { IPdfDensity, IPdfOptions } from '@/interfaces'
import { IObservation, IContact, IWell, ISample } from '@/interfaces/ocotillo'
import {
  buildPdfFilename,
  createPdfStyles,
  sanitizeContacts,
  SensorDeploymentRow,
} from '@/utils'
import { PDF_DEFAULT_VALUES } from '@/config'
import { useAllNotes } from '@/hooks/useAllNotes'
import { useMostRecentObservation } from '@/hooks/useMostRecentObservation'
import { usePrimaryAndSecondaryContact } from '@/hooks/usePrimaryAndSecondaryContact'
import {
  AdditionalInformation,
  CoreInformation,
  ContactInformation,
  ImageGallery,
  WellInformation,
  SensorDeploymentTable,
} from '@/components/pdf'
import { Footer, Header, LineItem } from '@/components/pdf/layout'
import { OcotilloDocument } from './OcotilloDocument'

/**
 * Lane 33 (Amendment G) — cap the photo column to 3 photos.
 */
const MAX_PHOTOS = 3

export const WellPDF = ({
  well,
  sample = {},
  assets,
  contacts,
  observations,
  options = {},
  sensorDeployments = [],
  hydrographImage,
  standalone = true,
  includeConfidentialContacts = true,
}: {
  well: IWell
  sample?: Partial<ISample>
  assets: BaseRecord[]
  contacts: IContact[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments?: SensorDeploymentRow[]
  options?: IPdfOptions
  hydrographImage?: string | null
  standalone?: boolean
  includeConfidentialContacts?: boolean
}) => {
  const density: IPdfDensity =
    options.density ?? PDF_DEFAULT_VALUES.density ?? 'standard'
  const isDense = density === 'standard' || density === 'compact'
  const styles = useMemo(() => createPdfStyles(density), [density])
  const filename = useMemo(() => buildPdfFilename(well), [well?.id])
  const visibleContacts = useMemo(
    () => sanitizeContacts(contacts, includeConfidentialContacts),
    [contacts, includeConfidentialContacts]
  )
  const showAdditionalOnFirstPage = density === 'compact'

  const mostRecentObservation = useMostRecentObservation(observations)
  const mostRecent = mostRecentObservation ?? {}
  const { primaryContact, secondaryContact } =
    usePrimaryAndSecondaryContact(visibleContacts)
  const allNotes = useAllNotes(well, options)

  /**
   * Lane 33: sort assets newest-first, cap at MAX_PHOTOS (3).
   * Assets are expected to have a `created_at` or `id` field for ordering;
   * we fall back to ID-descending when no timestamp is present.
   */
  const sortedAssets = useMemo(() => {
    const sorted = [...assets]
      .filter((a: any) => a.signed_url)
      .sort((a: any, b: any) => {
        // Newest-first by created_at
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        }
        // Fallback: descending id
        return (b.id as number ?? 0) - (a.id as number ?? 0)
      })
      .slice(0, MAX_PHOTOS)
    return sorted
  }, [assets])

  /**
   * Row 1 identity fields for the left (60%) column.
   * Mirrors the mock-up: Point ID | Northing
   *                         Site Name | Easting
   *                         Primary Contact | Secondary Contact
   *                         Location Notes | MP Height
   *                         Elevation | Well Depth
   *                         Last Measurements | (empty)
   *                         Site Notes (merged, no header)
   */
  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number]
    | undefined
  const [lon, lat] = coords ?? []
  const { easting, northing } =
    well?.current_location?.properties?.utm_coordinates ?? {}

  const siteName: string =
    well.alternate_ids?.find(
      (alt) =>
        alt.relation?.toLowerCase() === 'same_as' &&
        alt.alternate_organization?.toLowerCase() === 'nmbgmr'
    )?.alternate_id ?? ''

  const elevation = well?.current_location?.properties?.elevation
  const elevationUnit =
    well?.current_location?.properties?.elevation_unit ?? 'ft'

  const lastMeasurementDate =
    mostRecent?.observation_datetime != null
      ? new Date(mostRecent.observation_datetime).toISOString().slice(0, 10)
      : undefined
  const lastDepthToWater =
    mostRecent?.depth_to_water_bgs != null
      ? `${mostRecent.depth_to_water_bgs.toFixed(2)} ${mostRecent.unit}`
      : undefined

  /** Build a single row in the left column: title + value pair */
  const Row1Field = ({
    title,
    value,
    colSpan = 1,
  }: {
    title: string
    value?: string
    colSpan?: number
  }) => (
    <View
      style={{
        width: `${colSpan * 50}%`,
        marginBottom: density === 'compact' ? 1 : 1.5,
      }}
    >
      <Text style={styles.label}>{title}:</Text>
      <Text style={styles.value}>
        {value ?? (title === 'Elevation' ? 'N/A' : undefined)}
      </Text>
    </View>
  )

  const renderPhotos = () => (
    <View style={styles.photoColumn}>
      {sortedAssets.length > 0
        ? sortedAssets.map((img: any, idx: number) => (
            <View key={idx} style={styles.photoCell}>
              <Image style={styles.img} src={img.signed_url} />
              {img.label && (
                <Text style={styles.imgLabel}>{img.label}</Text>
              )}
            </View>
          ))
        : null}
    </View>
  )

  // ── Page 1 ──────────────────────────────────────────────────────────
  const page1 = (
    <Page size="A4" style={styles.page}>
      <Header styles={styles} />

      {/* Top-level row: 60% content + 33.33% photo strip */}
      <View style={styles.columnContainer}>
        {/* ── Content column (60%) ────────────────────────────────── */}
        <View style={styles.contentColumn}>
          {/* Row 1: Identity fields (2 inner columns) */}
          <View style={styles.rowRow}>
            <Row1Field title="Point ID" value={well?.name} colSpan={1} />
            <Row1Field title="Northing" value={northing?.toFixed(0)} />
          </View>
          <View style={styles.rowRow}>
            <Row1Field title="Site Name" value={siteName} colSpan={1} />
            <Row1Field title="Easting" value={easting?.toFixed(0)} />
          </View>
          <View style={styles.rowRow}>
            <Row1Field
              title="Primary Contact"
              value={primaryContact?.name}
            />
            <Row1Field
              title="Secondary Contact"
              value={secondaryContact?.name}
            />
          </View>
          <View style={styles.rowRow}>
            <Row1Field
              title="Location Notes"
              value={
                well?.current_location?.properties?.notes
                  ?.filter((n) => n.note_type === 'General')
                  .map((n) => n.content)
                  .join('; ') || 'N/A'
              }
            />
            <Row1Field
              title="MP Height"
              value={
                well?.measuring_point_height != null
                  ? `${well.measuring_point_height} ${well.measuring_point_height_unit ?? ''}`.trim()
                  : undefined
            }
            />
          </View>
          <View style={styles.rowRow}>
            <Row1Field
              title="Elevation"
              value={
                elevation != null
                  ? `${elevation.toFixed(2)} ${elevationUnit}`
                  : 'N/A'
              }
            />
            <Row1Field
              title="Well Depth"
              value={
                well?.well_depth != null
                  ? `${well.well_depth} ${well.well_depth_unit ?? ''}`.trim()
                  : undefined
            }
            />
          </View>
          <View style={styles.rowRow}>
            <Row1Field
              title="Last Measurements"
              value={
                lastMeasurementDate != null
                  ? lastDepthToWater
                    ? `${lastMeasurementDate} (${lastDepthToWater})`
                    : lastMeasurementDate
                  : undefined
              }
            />
          </View>

          {/* Site Notes: merged into row 1, no section header */}
          {well?.site_notes?.length ? (
            <View style={styles.rowRow}>
              <Row1Field
                title="Site Notes"
                value={
                  well.site_notes
                    .map((sn: any) => sn.content)
                    .filter(Boolean)
                    .join('; ') || undefined
                }
              />
            </View>
          ) : null}

          {/* ── Rows 2–7: Content flows into the 60% space via flex ─ */}
          {/* Row 2: Contact details */}
          <View style={styles.section}>
            <ContactInformation
              primaryContact={primaryContact}
              secondaryContact={secondaryContact}
              styles={styles}
              dense={isDense}
            />
          </View>

          {/* Row 3: Well Information */}
          <View style={styles.section}>
            <WellInformation
              well={well}
              mostRecent={mostRecent}
              sample={sample}
              styles={styles}
              dense={isDense}
              opts={options}
            />
          </View>

          {/* Row 4: Additional Information */}
          {showAdditionalOnFirstPage && (
            <View style={styles.section}>
              <AdditionalInformation
                well={well}
                styles={styles}
                dense={isDense}
                opts={options}
              />
            </View>
          )}

          {/* Row 5: Notes sections (merged, no extra headers) */}
          {allNotes.map((section) => (
            <LineItem
              key={section.title}
              title={
                section.title.toLowerCase().endsWith('notes')
                  ? section.title
                  : `${section.title} Notes`
              }
              value={section.value ?? undefined}
              styles={styles}
            />
          ))}

          {/* Row 6: Sensor deployment (if compact) */}
          {showAdditionalOnFirstPage && (
            <SensorDeploymentTable
              rows={sensorDeployments}
              styles={styles}
            />
          )}

          {/* Row 7: Hydrograph (if compact) */}
          {showAdditionalOnFirstPage && options.includeHydrograph !== false && (
            <>
              <Text style={styles.title}>Hydrograph</Text>
              {hydrographImage ? (
                <Image
                  src={hydrographImage}
                  style={{
                    width: '100%',
                    height: 220,
                    objectFit: 'contain',
                    marginTop: 6,
                    marginBottom: 10,
                  }}
                />
              ) : (
                <Text style={styles.pageNote}>
                  (Hydrograph unavailable)
                </Text>
              )}
            </>
          )}
        </View>
        {/* ── End content column ──────────────────────────────────── */}

        {/* ── Photo column (33.33%) ───────────────────────────────── */}
        {renderPhotos()}
        {/* ── End photo column ────────────────────────────────────── */}
      </View>

      {/* Image gallery on page 1 only when compact */}
      {showAdditionalOnFirstPage && assets.length > 0 && options.includeAssets !== false && (
        <ImageGallery assets={assets} styles={styles} />
      )}

      <Footer wellId={well?.name} styles={styles} />
    </Page>
  )

  // ── Page 2+ (non-compact) ─────────────────────────────────────────
  const remainingPages = !showAdditionalOnFirstPage
    ? [
        <Page size="A4" style={styles.page} key="p2">
          <Header styles={styles} />
          <SensorDeploymentTable
            rows={sensorDeployments}
            styles={styles}
          />
          <AdditionalInformation
            well={well}
            styles={styles}
            dense={isDense}
            opts={options}
          />
          {assets.length > 0 && options.includeAssets !== false && (
            <ImageGallery assets={assets} styles={styles} />
          )}
          <Footer wellId={well?.name} styles={styles} />
        </Page>,
      ]
    : []

  const hydrographPage = options.includeHydrograph
    ? [
        <Page size="A4" style={styles.page} key="hydrograph">
          <Header styles={styles} />
          <Text style={styles.title}>Hydrograph</Text>
          {hydrographImage ? (
            <Image
              src={hydrographImage}
              style={{
                width: '100%',
                height: 220,
                objectFit: 'contain',
                marginTop: 6,
                marginBottom: 10,
              }}
            />
          ) : (
            <Text style={styles.pageNote}>(Hydrograph unavailable)</Text>
          )}
          <Footer wellId={well?.name} styles={styles} />
        </Page>,
      ]
    : []

  const blankPage = options.includeBlankPage
    ? [
        <Page size="A4" style={styles.page} key="blank">
          <Header styles={styles} />
          <Text style={styles.pageNote}>
            (Page intentionally left blank)
          </Text>
          <Footer wellId={well?.name} styles={styles} />
        </Page>,
      ]
    : []

  const pages = <>{page1}{...remainingPages}{...hydrographPage}{...blankPage}</>

  if (!standalone) {
    return pages
  }

  return (
    <OcotilloDocument title={filename || null} subject="Well Field Data Report">
      {pages}
    </OcotilloDocument>
  )
}
