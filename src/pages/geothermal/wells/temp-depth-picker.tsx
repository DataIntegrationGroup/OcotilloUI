import { WellPickerPage } from './WellPickerPage'

/** Entry point for the temperature-depth log. */
export const GeoThermalTempDepthPicker = () => (
  <WellPickerPage
    title="Temp-depth log"
    description="Pick a well to open its temperature-depth grid."
    targetPath="/geothermal/wells/temp-depth"
    deniedMessage="You need the Geothermal Admin role to enter temp-depth data."
  />
)
