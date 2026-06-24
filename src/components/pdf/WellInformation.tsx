import { View } from '@react-pdf/renderer'
import { LineItem } from '@/components/pdf/layout'
import type { IObservation, ISample, IWell } from '@/interfaces/ocotillo'
import { createPdfStyles } from '@/utils'
import { IPdfOptions } from '@/interfaces'

export const WellInformation = ({
  well,
  mostRecent,
  sample,
  styles,
  dense = false,
  opts,
}: {
  well: IWell
  mostRecent: Partial<IObservation>
  sample: Partial<ISample>
  styles: ReturnType<typeof createPdfStyles>
  dense?: boolean
  opts: IPdfOptions
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="Well Depth"
            value={
              well?.well_depth
                ? `${well?.well_depth} ${well.well_depth_unit}`
                : undefined
            }
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Measuring Point Height"
            value={
              well?.measuring_point_height
                ? `${well?.measuring_point_height} ${well?.measuring_point_height_unit}`
                : undefined
            }
            styles={styles}
            dense={dense}
          />
        </View>
        {opts.includeHoleDepth ? (
          <View style={styles.cell3}>
            <LineItem
              title="Hole Depth"
              value={
                well?.hole_depth
                  ? `${well?.hole_depth} ${well?.hole_depth_unit}`
                  : undefined
              }
              styles={styles}
              dense={dense}
            />
          </View>
        ) : (
          <View style={styles.cell3}></View>
        )}
      </View>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="WL Method"
            value={sample?.sample_method ?? undefined}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3Span2}>
          <LineItem
            title="Measuring Point"
            value={well?.measuring_point_description ?? undefined}
            styles={styles}
            dense={dense}
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
                : undefined
            }
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Last Depth to Water BGS"
            value={
              mostRecent?.depth_to_water_bgs != null
                ? `${mostRecent.depth_to_water_bgs.toFixed(2)} ${mostRecent.unit}`
                : undefined
            }
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Level Status"
            value={mostRecent?.groundwater_level_reason ?? undefined}
            styles={styles}
            dense={dense}
          />
        </View>
      </View>
    </View>
  )
}
