import { IAddress, IContact, IWell } from '@/interfaces/ocotillo'
import { BaseRecord } from '@refinedev/core'
import { buildPdfFilename, groupNotesByType } from '@/utils'
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from '@react-pdf/renderer'
import { useMemo } from 'react'
import { IObservation } from '@/interfaces/ocotillo/IObservation'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    paddingBottom: 25,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 10,
  },
  subSection: {
    marginLeft: 16,
    marginBottom: 0,
  },
  twoByTwoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cell3: {
    width: '32%', // slightly less than 1/3 for spacing
    marginBottom: 2,
  },
  cell2: {
    width: '48%', // slightly less than 1/2 for spacing
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    marginBottom: 5,
  },
  imgLabel: {
    fontSize: 10,
    margin: 4,
  },
  pageNote: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  img: {
    width: 175,
    height: 'auto',
    marginTop: 4,
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 0,
    objectFit: 'contain',
    alignSelf: 'flex-start',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#777',
  },
})

export const WellPDF = ({
  well,
  assets,
  contacts,
  observations,
}: {
  well: IWell
  assets: BaseRecord[]
  contacts: IContact[]
  observations: readonly Partial<IObservation>[]
}) => {
  const filename = useMemo(() => buildPdfFilename(well), [well?.id])

  const { mostRecentObservation } = useMemo(() => {
    if (!observations?.length) return { mostRecentObservation: undefined }

    // Sort descending by observation_datetime (most recent first)
    const sorted = [...observations].sort((a, b) => {
      const aTime = new Date(a.observation_datetime ?? 0).getTime()
      const bTime = new Date(b.observation_datetime ?? 0).getTime()
      return bTime - aTime
    })

    return { mostRecentObservation: sorted[0] }
  }, [observations])

  const { primaryContact, secondaryContact } = useMemo(() => {
    if (!contacts?.length)
      return { primaryContact: undefined, secondaryContact: undefined }

    // Normalize labels to lowercase once for efficiency
    const normalized = contacts.map((c) => ({
      ...c,
      _type: c.contact_type?.toLowerCase() || '',
    }))

    const primary =
      normalized.find((c) => c._type === 'primary') ??
      normalized.find((c) => c._type === 'owner') ??
      normalized[0]

    // Pick secondary (only if we have >1 contact)
    let secondary: (typeof contacts)[number] | undefined
    if (normalized.length > 1) {
      secondary =
        normalized.find((c) => c._type === 'secondary') ??
        normalized.find((c) => c !== primary)
    }

    return { primaryContact: primary, secondaryContact: secondary }
  }, [contacts])

  const allNotes = [
    ...(well?.water_notes ?? []),
    ...(well?.measuring_notes ?? []),
    ...(well?.construction_notes ?? []),
    ...(well?.general_notes ?? []),
    ...(well?.current_location?.properties?.notes ?? []),
    ...(well?.sampling_procedure_notes ?? []),
  ]

  const noteSections = groupNotesByType(allNotes, { defaultTitle: 'Notes' })
  const sections =
    noteSections.length > 0 ? noteSections : [{ title: 'Notes', value: null }]
  const formatSectionTitle = (title: string) =>
    title.toLowerCase().endsWith('notes') ? title : `${title} Notes`

  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number, number?]
    | undefined

  const [lon, lat] = coords ?? []

  const { easting, northing } =
    well?.current_location?.properties?.utm_coordinates

  return (
    <Document
      title={filename || null}
      author="NMBGMR Ocotillo"
      creator="NMBGMR Ocotillo System"
      language="en-US"
      subject="Well Field Data Report"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Field Compilation Notes</Text>
        <View style={styles.section}>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell3}>
              <LineItem title="Well Id" value={well?.name} />
            </View>
            <View style={styles.cell3}></View>
            <View style={styles.cell3}>
              <Text style={styles.label}>Date:</Text>
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Easting/Northing"
                value={`${easting?.toFixed(0)}, ${northing?.toFixed(0)}`}
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Vertical Datum"
                value={well?.current_location?.properties?.vertical_datum}
              />
            </View>
            <View style={styles.cell3}></View>
            <View style={styles.cell3}>
              <LineItem
                title="Latitude/Longitude"
                value={
                  well?.current_location?.geometry
                    ? `${lat?.toFixed(6)}, ${lon?.toFixed(6)}`
                    : 'N/A'
                }
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Elevation"
                value={`${well?.current_location?.properties?.elevation?.toFixed(2) || 'N/A'} ${
                  well?.current_location?.properties?.elevation_unit
                    ? ` ${well?.current_location?.properties?.elevation_unit}`
                    : null
                }`}
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Elevation Method"
                value={well?.current_location?.properties?.elevation_method}
              />
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell2}>
              <LineItem title="Primary Contact" value={primaryContact?.name} />
            </View>
            <View style={styles.cell2}>
              <LineItem
                title="Secondary Contact"
                value={secondaryContact?.name}
              />
            </View>
            <View style={styles.cell2}>
              <SubLineItem title="Role" value={primaryContact?.role} />
            </View>
            <View style={styles.cell2}>
              <SubLineItem title="Role" value={secondaryContact?.role} />
            </View>
            <View style={styles.cell2}>
              <SubLineItem
                title="Address"
                value={formatAddress(primaryContact?.addresses[0])}
              />
            </View>
            <View style={styles.cell2}>
              <SubLineItem
                title="Address"
                value={formatAddress(secondaryContact?.addresses[0])}
              />
            </View>

            <View style={styles.cell2}>
              <SubLineItem
                title="Phone"
                value={
                  primaryContact?.phones?.[0]?.phone_number ??
                  primaryContact?.phones?.[0]?.nma_phone_number
                }
              />
            </View>
            <View style={styles.cell2}>
              <SubLineItem
                title="Phone"
                value={
                  secondaryContact?.phones?.[0]?.phone_number ??
                  secondaryContact?.phones?.[0]?.nma_phone_number
                }
              />
            </View>

            <View style={styles.cell2}>
              <SubLineItem
                title="Email"
                value={primaryContact?.emails?.[0]?.email}
              />
            </View>
            <View style={styles.cell2}>
              <SubLineItem
                title="Email"
                value={secondaryContact?.emails?.[0]?.email}
              />
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell3}>
              <LineItem
                title="Hole Depth"
                value={
                  well?.hole_depth
                    ? `${well?.hole_depth} ${well?.hole_depth_unit}`
                    : null
                }
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Well Depth"
                value={
                  well?.well_depth
                    ? `${well?.well_depth} ${well.well_depth_unit}`
                    : null
                }
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Measuring Point Height"
                value={
                  well?.measuring_point_height
                    ? `${well?.measuring_point_height} ${well?.measuring_point_height_unit}`
                    : null
                }
              />
            </View>
          </View>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell3}>
              <LineItem
                title="Last Measured Date"
                value={
                  mostRecentObservation?.observation_datetime
                    ? new Date(mostRecentObservation.observation_datetime)
                        .toISOString()
                        .slice(0, 10)
                    : null
                }
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Last Depth to Water"
                value={
                  mostRecentObservation?.depth_to_water_bgs != null
                    ? `${mostRecentObservation.depth_to_water_bgs.toFixed(2)} ${mostRecentObservation.unit}`
                    : null
                }
              />
            </View>
            <View style={styles.cell3}></View>
          </View>
          {sections.map((section) => (
            <LineItem
              key={section.title}
              title={formatSectionTitle(section.title)}
              value={section.value ?? undefined}
            />
          ))}
        </View>
        {assets.length === 0 && (
          <Text style={styles.pageNote}>
            (No images are associated with this well)
          </Text>
        )}
        <Footer wellId={well?.name} />
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Field Compilation Notes</Text>
        <View style={styles.section}>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell3}>
              <LineItem
                title="Completion Date"
                value={well?.well_completion_date}
              />
            </View>
            <View style={styles.cell3}>
              <LineItem title="Driller Name" value={well?.well_driller_name} />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Construction Method"
                value={well?.well_construction_method}
              />
            </View>
          </View>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell2}>
              <LineItem
                title="Completion Date Source"
                value={well?.well_completion_date_source}
              />
            </View>
            <View style={styles.cell2}>
              <LineItem
                title="Construction Method Source"
                value={well?.well_construction_method_source}
              />
            </View>
          </View>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell3}>
              <LineItem
                title="Casing Diameter"
                value={
                  well?.well_casing_diameter
                    ? `${well?.well_casing_diameter?.toFixed(2)} ${well?.well_casing_diameter_unit}`
                    : null
                }
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Casing Depth"
                value={
                  well?.well_casing_depth
                    ? `${well?.well_casing_depth?.toFixed(2)} ${well?.well_casing_depth_unit}`
                    : null
                }
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Casing Materials"
                value={(well?.well_casing_materials ?? []).join(', ')}
              />
            </View>
          </View>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell3}>
              <LineItem title="Pump Type" value={well?.well_pump_type} />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Pump Depth"
                value={
                  well?.well_pump_depth
                    ? `${well?.well_pump_depth?.toFixed(2)} ${well?.well_pump_depth_unit}`
                    : null
                }
              />
            </View>
            <View style={styles.cell3}>
              <LineItem
                title="Is open and suitable for a datalogger?"
                value={well?.is_suitable_for_datalogger?.toString()}
              />
            </View>
          </View>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell3}>
              <LineItem
                title="Formation Completion Code"
                value={well?.formation_completion_code}
              />
            </View>
            <View style={styles.cell3}></View>
            <View style={styles.cell3}></View>
          </View>
          <View style={styles.twoByTwoGrid}>
            <View style={styles.cell2}>
              <LineItem
                title="Aquifer Systems"
                value={(well?.aquifers ?? [])
                  .map((a) => a?.aquifer_system)
                  .filter(Boolean)
                  .join(', ')}
              />
            </View>
            <View style={styles.cell2}>
              <LineItem
                title="Aquifer Types"
                value={
                  well?.aquifers && well.aquifers.length > 0
                    ? [
                        ...new Set(
                          well.aquifers.flatMap((a) => a.aquifer_types)
                        ),
                      ].join(', ')
                    : null
                }
              />
            </View>
          </View>
        </View>
      </Page>
      {assets.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Field Compilation Notes</Text>
          <View style={styles.section}>
            <Text style={styles.label}>Image Gallery</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {assets.map((img: any, idx: number) =>
                img.signed_url ? (
                  <View key={idx}>
                    <Image style={styles.img} src={img.signed_url} />
                    <Text style={styles.imgLabel}>{img.label}</Text>
                  </View>
                ) : null
              )}
            </View>
          </View>
          <Footer wellId={well?.name} />
        </Page>
      )}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Field Compilation Notes</Text>
        <Text style={styles.pageNote}>(Page intentionally left blank)</Text>
        <Footer wellId={well?.name} />
      </Page>
    </Document>
  )
}

const formatTitle = (title: string) => {
  if (title.endsWith(':') || title.endsWith('?')) {
    return title
  }
  return `${title}:`
}

const LineItem = ({
  title,
  value,
}: {
  title: string
  value?: string | number
}) => {
  const safe = (v: React.ReactNode, fallback = 'N/A') =>
    v === null || v === undefined || v === '' ? fallback : v

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{formatTitle(title)}</Text>
      <Text style={styles.value}>{safe(value)}</Text>
    </View>
  )
}

const SubLineItem = ({
  title,
  value,
}: {
  title: string
  value?: string | number
}) => {
  const safe = (v: React.ReactNode, fallback = 'N/A') =>
    v === null || v === undefined || v === '' ? fallback : v

  return (
    <View style={styles.subSection}>
      <Text style={styles.label}>{formatTitle(title)}</Text>
      <Text style={styles.value}>{safe(value)}</Text>
    </View>
  )
}

export const formatAddress = (a?: IAddress | null): string => {
  if (!a) return 'N/A'

  const lines: string[] = []

  if (a.address_line_1) lines.push(a.address_line_1)
  if (a.address_line_2) lines.push(a.address_line_2)

  const cityStateZip = [a.city, a.state, a.postal_code]
    .filter(Boolean)
    .join(', ')
  if (cityStateZip) lines.push(cityStateZip)

  if (a.country) lines.push(a.country)

  // React-PDF supports "\n" for multi-line text
  return lines.join('\n')
}

const Footer = ({ wellId }: { wellId: string | number }) => (
  <View
    fixed
    style={styles.footer}
    render={({ pageNumber }) => (
      <Text style={styles.footerText}>
        {`Well ID: ${wellId} | Page ${pageNumber}`}
      </Text>
    )}
  />
)
