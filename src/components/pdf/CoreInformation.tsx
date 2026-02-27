import { View, Text } from '@react-pdf/renderer'
import { LineItem } from '@/components/pdf/layout'
import type { IWell } from '@/interfaces/ocotillo'
import { createPdfStyles } from '@/utils'

export const CoreInformation = ({
  well,
  styles,
  dense = false,
}: {
  well: IWell
  styles: ReturnType<typeof createPdfStyles>
  dense?: boolean
}) => {
  const coords = well?.current_location?.geometry?.coordinates as
    | [number, number]
    | undefined
  const [lon, lat] = coords ?? []
  const { easting, northing } =
    well?.current_location?.properties?.utm_coordinates ?? {}

  const siteName: string =
    well.alternate_ids?.find((alt_id) => (alt_id.relation = 'OSEPOD'))
      .alternate_id ?? ''

  return (
    <View style={styles.section}>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="Point ID"
            value={well?.name}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}></View>
        <View style={styles.cell3}>
          <Text style={styles.label}>Date:</Text>
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Site Name"
            value={siteName}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Easting"
            value={easting?.toFixed(0)}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Northing"
            value={northing?.toFixed(0)}
            styles={styles}
            dense={dense}
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
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Latitude"
            value={lat?.toFixed(6)}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Longitude"
            value={lon?.toFixed(6)}
            styles={styles}
            dense={dense}
          />
        </View>
      </View>
    </View>
  )
}
