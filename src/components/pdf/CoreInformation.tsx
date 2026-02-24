import { View, Text } from '@react-pdf/renderer'
import { LineItem } from '@/components/pdf/layout'
import type { IWell } from '@/interfaces/ocotillo'
import { createPdfStyles } from '@/utils'

export const CoreInformation = ({
  well,
  styles,
}: {
  well: IWell
  styles: ReturnType<typeof createPdfStyles>
}) => {
  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number]
    | undefined
  const [lon, lat] = coords ?? []
  const { easting, northing } =
    well?.current_location?.properties?.utm_coordinates ?? {}

  return (
    <View style={styles.section}>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem title="Well Id" value={well?.name} styles={styles} />
        </View>
        <View style={styles.cell3}></View>
        <View style={styles.cell3}>
          <Text style={styles.label}>Date:</Text>
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Easting/Northing"
            value={`${easting?.toFixed(0)}, ${northing?.toFixed(0)}`}
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Vertical Datum"
            value={well?.current_location?.properties?.vertical_datum}
            styles={styles}
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
            styles={styles}
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
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Elevation Method"
            value={well?.current_location?.properties?.elevation_method}
            styles={styles}
          />
        </View>
      </View>
    </View>
  )
}
