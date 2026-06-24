import { View } from '@react-pdf/renderer'
import { LineItem } from '@/components/pdf/layout'
import type { IWell } from '@/interfaces/ocotillo'
import { createPdfStyles } from '@/utils'
import { IPdfOptions } from '@/interfaces'

export const AdditionalInformation = ({
  well,
  styles,
  dense = false,
  opts,
}: {
  well: IWell
  styles: ReturnType<typeof createPdfStyles>
  dense?: boolean
  opts: IPdfOptions
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell2}>
          <LineItem
            title="Construction Method"
            value={well?.well_construction_method ?? undefined}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell2}>
          <LineItem
            title="Construction Method Source"
            value={well?.well_construction_method_source ?? undefined}
            styles={styles}
            dense={dense}
          />
        </View>
      </View>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell3}>
          <LineItem
            title="Pump Type"
            value={well?.well_pump_type ?? undefined}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell3}>
          <LineItem
            title="Pump Depth"
            value={
              well?.well_pump_depth
                ? `${well?.well_pump_depth?.toFixed(2)} ${well?.well_pump_depth_unit}`
                : undefined
            }
            styles={styles}
            dense={dense}
          />
        </View>
        {opts.includeCasingDiameter ? (
          <View style={styles.cell3}>
            <LineItem
              title="Casing Diameter"
              value={
                well?.well_casing_diameter
                  ? `${well?.well_casing_diameter?.toFixed(2)} ${well?.well_casing_diameter_unit}`
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
      {(opts.includeFormationCompletionCode ||
        opts.includeIsOpenAndSuitableForDataLogger) && (
        <View style={styles.twoByTwoGrid}>
          {opts.includeFormationCompletionCode ? (
            <View style={styles.cell2}>
              <LineItem
                title="Formation Completion Code"
                value={well?.formation_completion_code ?? undefined}
                styles={styles}
                dense={dense}
              />
            </View>
          ) : (
            <View style={styles.cell2}></View>
          )}
          {opts.includeIsOpenAndSuitableForDataLogger ? (
            <View style={styles.cell2}>
              <LineItem
                title="Is open and suitable for a datalogger?"
                value={well?.is_suitable_for_datalogger?.toString()}
                styles={styles}
                dense={dense}
              />
            </View>
          ) : (
            <View style={styles.cell2}></View>
          )}
        </View>
      )}
      {(opts.includeAquiferSystems || opts.includeAquiferTypes) && (
        <View style={styles.twoByTwoGrid}>
          {opts.includeAquiferSystems ? (
            <View style={styles.cell2}>
              <LineItem
                title="Aquifer Systems"
                value={(well?.aquifers ?? [])
                  .map((a) => a?.aquifer_system)
                  .filter(Boolean)
                  .join(', ')}
                styles={styles}
                dense={dense}
              />
            </View>
          ) : (
            <View style={styles.cell2}></View>
          )}
          {opts.includeAquiferTypes ? (
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
                    : undefined
                }
                styles={styles}
                dense={dense}
              />
            </View>
          ) : (
            <View style={styles.cell2}></View>
          )}
        </View>
      )}
    </View>
  )
}
