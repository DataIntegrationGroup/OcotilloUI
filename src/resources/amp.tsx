import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import Construction from '@mui/icons-material/Construction'
import Plumbing from '@mui/icons-material/Plumbing'
import Cable from '@mui/icons-material/Cable'
import Water from '@mui/icons-material/Water'
import ScienceOutlined from '@mui/icons-material/ScienceOutlined'
import CategoryOutlined from '@mui/icons-material/CategoryOutlined'
import { DynamicFormTwoTone } from '@mui/icons-material'

let amp = [
  {
    name: 'Sandbox',
    meta: {
      label: 'Sandbox',
    },
  },
  {
    name: 'dashboard',
    list: '/amp/dashboard',
    meta: {
      label: 'Dashboard',
      icon: <DashboardOutlined />,
      wip: true,
    },
  },
  {
    name: 'hydrographcorrector',
    list: '/amp/hydrographcorrector',
    meta: {
      label: 'Hydrograph Corrector',
      icon: <Construction />,
      wip: true,
    },
  },
  {
    name: 'reportbuilder',
    list: '/amp/reportbuilder',
    meta: {
      label: 'Report Builder',
      icon: <Construction />,
      wip: true,
    },
  },
  {
    name: 'querybuilder',
    list: '/amp/querybuilder',
    meta: {
      label: 'Query Builder',
      icon: <Construction />,
      wip: true,
    },
  },
  {
    name: 'wellinventoryform',
    list: '/amp/wellinventoryform',
    meta: {
      label: 'Well Inventory Form',
      icon: <DynamicFormTwoTone />,
      wip: true,
    },
  },
  {
    name: 'waterlevelform',
    list: '/amp/waterlevelform',
    meta: {
      label: 'Water Level Form',
      icon: <Water />,
      wip: true,
    },
  },
  {
    name: 'projects',
    list: '/amp/projects',
    meta: {
      label: 'Projects',
      icon: <CategoryOutlined />,
      wip: true,
    },
  },

  {
    name: 'wells',
    icon: <Plumbing />,
    list: '/amp/wells',
    edit: '/amp/wells/edit/:id',
    show: '/amp/wells/show/:id',
    create: '/amp/wells/create',
    meta: {
      label: 'Wells',
      wip: true,
    },
  },
  {
    name: 'equipment',
    icon: <Cable />,
    list: '/amp/equipment',
    edit: '/amp/equipment/edit/:id',
    create: '/amp/equipment/create',
    show: '/amp/equipment/show/:id',
    meta: {
      label: 'Equipment',
      wip: true,
    },
  },
  {
    name: 'manual_waterlevels',
    list: '/amp/manualwaterlevels',
    edit: '/amp/manualwaterlevels/edit/:id',
    create: '/amp/manualwaterlevels/create',
    show: '/amp/manualwaterlevels/show/:id',
    meta: {
      label: 'Manual Water Levels',
      wip: true,
    },
  },
  {
    name: 'Chemistry',
    icon: <ScienceOutlined />,
    meta: {
      label: 'Chemistry',
    },
  },
]

export const ampResources = amp.map((b) => {
  let meta = b.meta || {}
  if (!meta['parent']) {
    meta['parent'] = 'Sandbox'
  }
  meta['dataProviderName'] = 'amp'
  return {
    ...b,
    name: `water.${b.name}`,
    meta: meta,
  }
})

export const allAmpResources = [...ampResources]
