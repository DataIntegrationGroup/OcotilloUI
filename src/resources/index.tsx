import { allAmpResources } from '@/resources/amp'
import { ocotilloResources } from '@/resources/ocotillo'
import { geothermalResources } from '@/resources/geothermal'
import { DeviceThermostat } from '@mui/icons-material'

const geothermalParent = {
  name: 'geothermal',
  meta: {
    label: 'Geothermal',
    icon: <DeviceThermostat />,
  },
}

// No parent group: ocotillo items are top-level in the sidebar (Map, Wells, etc.)
export const resources = [
  ...ocotilloResources,
  ...allAmpResources,
  geothermalParent,
  ...geothermalResources,
]
