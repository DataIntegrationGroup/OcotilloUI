import { View } from '@react-pdf/renderer'
import { LineItem } from '@/components/pdf/layout'
import type { IObservation, IWell } from '@/interfaces/ocotillo'
import { createPdfStyles } from '@/utils'

export const WellInformation = ({
  well,
  mostRecent,
  styles,
}: {
  well: IWell
  mostRecent: Partial<IObservation>
  styles: ReturnType<typeof createPdfStyles>
}) => {
  return (
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
            styles={styles}
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
            styles={styles}
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
            styles={styles}
          />
        </View>
      </View>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="Last Measured Date"
            value={
              mostRecent?.observation_datetime
                ? new Date(mostRecent.observation_datetime)
                    .toISOString()
                    .slice(0, 10)
                : null
            }
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Last Depth to Water"
            value={
              mostRecent?.depth_to_water_bgs != null
                ? `${mostRecent.depth_to_water_bgs.toFixed(2)} ${mostRecent.unit}`
                : null
            }
            styles={styles}
          />
        </View>
        <View style={styles.cell3}></View>
      </View>
    </View>
  )
}
