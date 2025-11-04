import { IAddress, IContact, IWell } from '@/interfaces/ocotillo/IThing'
import { BaseRecord } from '@refinedev/core'
import { buildPdfFilename, convertLonLatToUTM, parseWktPoint } from '@/utils'
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from '@react-pdf/renderer'
import { useMemo } from 'react'

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
    marginBottom: 1,
  },
  cell2: {
    width: '48%', // slightly less than 1/2 for spacing
    marginBottom: 1,
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
}: {
  well: IWell
  assets: BaseRecord[]
  contacts: IContact[]
}) => {
  const coords = parseWktPoint(well?.current_location?.point)
  const [easting, northing] = coords
    ? convertLonLatToUTM(coords.lon, coords.lat)
    : [undefined, undefined]

  const filename = useMemo(() => buildPdfFilename(well), [well?.id])

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

  return (
    <Document
      title={filename}
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
            <View style={styles.cell3}>
              <LineItem
                title="Site Name"
                value={(well as unknown as any)?.site_name}
              />
            </View>
            <View style={styles.cell3}>
              <Text style={styles.label}>Date:</Text>
            </View>
            <View style={styles.cell3}>
              <LineItem title="Easting" value={easting?.toFixed(0)} />
            </View>
            <View style={styles.cell3}>
              <LineItem title="Northing" value={northing?.toFixed(0)} />
            </View>
            <View style={styles.cell3}></View>
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
          <LineItem
            title="Location Notes"
            value={well?.current_location?.notes}
          />
          <LineItem
            title="Measurement Notes"
            value={(well as unknown as any)?.measurement_notes}
          />
          <LineItem
            title="Well Depth"
            value={
              well?.well_depth
                ? `${well?.well_depth} ${well.well_depth_unit}`
                : null
            }
          />
          <LineItem
            title="Last Measured Date"
            value={(well as unknown as any)?.last_measured_date}
          />
          <LineItem
            title="Last Depth to Water"
            value={(well as unknown as any)?.last_depth_to_water}
          />
        </View>
        {assets.length === 0 && (
          <Text style={styles.pageNote}>
            (No images are associated with this well)
          </Text>
        )}
        <Footer wellId={well?.name} />
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
      <Text style={styles.label}>{title}:</Text>
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
      <Text style={styles.label}>{title}:</Text>
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
