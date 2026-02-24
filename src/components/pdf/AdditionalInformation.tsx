import { View } from '@react-pdf/renderer'
import { LineItem } from '@/components/pdf/layout'
import type { IWell } from '@/interfaces/ocotillo'
import { createPdfStyles } from '@/utils'

export const AdditionalInformation = ({
  well,
  styles,
}: {
  well: IWell
  styles: ReturnType<typeof createPdfStyles>
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="Completion Date"
            value={well?.well_completion_date}
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Driller Name"
            value={well?.well_driller_name}
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Construction Method"
            value={well?.well_construction_method}
            styles={styles}
          />
        </View>
      </View>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell2}>
          <LineItem
            title="Completion Date Source"
            value={well?.well_completion_date_source}
            styles={styles}
          />
        </View>
        <View style={styles.cell2}>
          <LineItem
            title="Construction Method Source"
            value={well?.well_construction_method_source}
            styles={styles}
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
            styles={styles}
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
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Casing Materials"
            value={(well?.well_casing_materials ?? []).join(', ')}
            styles={styles}
          />
        </View>
      </View>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="Pump Type"
            value={well?.well_pump_type}
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Pump Depth"
            value={
              well?.well_pump_depth
                ? `${well?.well_pump_depth?.toFixed(2)} ${well?.well_pump_depth_unit}`
                : null
            }
            styles={styles}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Is open and suitable for a datalogger?"
            value={well?.is_suitable_for_datalogger?.toString()}
            styles={styles}
          />
        </View>
      </View>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="Formation Completion Code"
            value={well?.formation_completion_code}
            styles={styles}
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
            styles={styles}
          />
        </View>
        <View style={styles.cell2}>
          <LineItem
            title="Aquifer Types"
            value={
              well?.aquifers && well.aquifers.length > 0
                ? [
                    ...new Set(well.aquifers.flatMap((a) => a.aquifer_types)),
                  ].join(', ')
                : null
            }
            styles={styles}
          />
        </View>
      </View>
    </View>
  )
}
