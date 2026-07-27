import { WellPickerPage } from './WellPickerPage'

/** Sandbox entry point for the geothermal records grid. */
export const GeoThermalRecordsGridPicker = () => (
  <WellPickerPage
    title="Geothermal records"
    description="Pick a well to open its records data-entry grid."
    targetPath="/geothermal/wells/records-grid"
    deniedMessage="You need the Geothermal Admin role to enter well data."
  />
)
