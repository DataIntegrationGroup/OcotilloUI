import { IWell } from '@/interfaces/ocotillo/IThing'
import { BaseRecord, useList } from '@refinedev/core'
import { convertLonLatToUTM, parseWktPoint } from '@/utils'
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    marginBottom: 5,
  },
  img: {
    width: 150,
    height: 100,
    margin: 4,
  },
})

export const WellPDF = ({
  well,
  assets,
}: {
  well: IWell
  assets: BaseRecord[]
}) => {
  const coords = parseWktPoint(well?.current_location?.point)
  const [easting, northing] = coords
    ? convertLonLatToUTM(coords.lon, coords.lat)
    : [undefined, undefined]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Field Compilation Notes</Text>

        <View style={styles.section}>
          <LineItem title="Well Id" value={well?.name} />
          <LineItem
            title="Site Name"
            value={(well as unknown as any)?.site_name}
          />
          <LineItem title="Easting" value={easting?.toFixed(0)} />
          <LineItem title="Northing" value={northing?.toFixed(0)} />
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

        {assets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Image Gallery</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {assets.map((img: any, idx: number) =>
                img.signed_url ? (
                  <View key={idx}>
                    {/* @react-pdf/renderer requires <Image />, not <img /> */}
                    <Image style={styles.img} src={img.signed_url} />
                  </View>
                ) : null
              )}
            </View>
          </View>
        )}
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
