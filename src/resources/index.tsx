import { st2Resources } from '@/resources/st2'
import { ocotilloResources } from '@/resources/ocotillo'
import { FactoryOutlined, SensorsOutlined } from '@mui/icons-material'

let base = [
  {
    name: 'ocotillo',
    icon: <FactoryOutlined />,
    meta: { label: 'NMBGMR Ocotillo' },
  }
/*   {
    name: 'st2',
    icon: <SensorsOutlined />,
    meta: { label: 'NMWDI SensorThings' },
  }, */
]

export const resources = [...base, ...ocotilloResources /* ...st2Resources */]
