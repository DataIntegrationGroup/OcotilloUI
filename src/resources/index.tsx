import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined'
import AccessTime from '@mui/icons-material/AccessTime'
import HeatPumpOutlined from '@mui/icons-material/HeatPumpOutlined'
import DiamondOutlined from '@mui/icons-material/DiamondOutlined'
import { ampResources, lookup } from '@/resources/amp'
import { geochronologyResources } from '@/resources/geochronology'
import { criticalMineralResources } from '@/resources/criticalminerals'
import { geothermalResources } from '@/resources/geothermal'
import { st2Resources } from '@/resources/st2'
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined'
import { dataforgeResources } from '@/resources/dataforge'
import TableViewIcon from '@mui/icons-material/TableView'
import { FactoryOutlined } from '@mui/icons-material'

let base = [
  {
    name: 'dataforge',
    icon: <FactoryOutlined />,
    meta: { label: 'DataForge (Coming Soon)' },
  },
  {
    name: 'st2',
    icon: <SensorsOutlinedIcon />,
    meta: { label: 'NMWDI SensorThings' },
  },
  {
    name: 'water',
    icon: <WaterDropOutlined />,
    meta: { label: 'Water (Deprecated)', disabled: true },
  },
  {
    name: 'geochronology',
    icon: <AccessTime />,
    meta: { label: 'Geochronology', disabled: true },
  },
  {
    name: 'criticalminerals',
    icon: <DiamondOutlined />,
    meta: { label: 'Critical Minerals', disabled: true },
  },
  {
    name: 'geothermal',
    icon: <HeatPumpOutlined />,
    meta: { label: 'Geothermal', disabled: true },
  },
]

export const resources = [
  ...base,
  ...dataforgeResources,
  ...ampResources,
  ...lookup,
  ...st2Resources,
  ...geochronologyResources,
  ...criticalMineralResources,
  ...geothermalResources,
]
