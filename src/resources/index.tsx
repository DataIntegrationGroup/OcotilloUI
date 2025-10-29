import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined'
import { st2Resources } from '@/resources/st2'
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined'
import { ocotilloResources } from '@/resources/ocotillo'
import { FactoryOutlined } from '@mui/icons-material'

let base = [
  {
    name: 'ocotillo',
    icon: <FactoryOutlined />,
    meta: { label: 'NMBGMR Ocotillo' },
  }
/*   {
    name: 'st2',
    icon: <SensorsOutlinedIcon />,
    meta: { label: 'NMWDI SensorThings' },
  }, */
]

export const resources = [...base, ...ocotilloResources /* ...st2Resources */]
