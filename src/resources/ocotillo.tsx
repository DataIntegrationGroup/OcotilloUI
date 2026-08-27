import {
  // Apps,
  Construction,
  DatasetLinked,
  Contacts,
  // DynamicFormOutlined,
  Image,
  LibraryBooksOutlined,
  // Link,
  Map,
  // MoreVertOutlined,
  Opacity,
  PictureAsPdfOutlined,
  Place,
  ScaleOutlined,
  ScienceOutlined,
  // SettingsInputAntenna,
  // Spa,
  Timeline,
  Workspaces,
} from '@mui/icons-material'
import type { ResourceMeta } from './types'

let tables: {
  name: string
  edit?: string
  show?: string
  create?: string
  list?: string
  meta: ResourceMeta
}[] = [
  {
    name: 'thing-well',
    list: '/ocotillo/well',
    show: '/ocotillo/well/show/:id',
    create: '/ocotillo/well/create',
    meta: {
      label: 'Wells',
      icon: <Opacity />,
    },
  },
  // {
  //   name: 'thing-spring',
  //   list: '/ocotillo/spring',
  //   edit: '/ocotillo/spring/edit/:id',
  //   show: '/ocotillo/spring/show/:id',
  //   create: '/ocotillo/spring/create',
  //   meta: {
  //     label: 'Springs',
  //     icon: <Spa />,
  //   },
  // },
  {
    name: 'contact',
    list: '/ocotillo/contact',
    show: '/ocotillo/contact/show/:id',
    meta: {
      icon: <Contacts />,
      label: 'Contacts & Owners',
    },
  },
  // {
  //   name: 'group',
  //   list: '/ocotillo/group',
  //   edit: '/ocotillo/group/edit/:id',
  //   show: '/ocotillo/group/show/:id',
  //   create: '/ocotillo/group/create',
  //   meta: {
  //     label: 'Groups / Projects',
  //     icon: <Workspaces />,
  //   },
  // },
  // {
  //   name: 'asset',
  //   list: '/ocotillo/asset',
  //   create: '/ocotillo/asset/create',
  //   edit: '/ocotillo/asset/edit/:id',
  //   show: '/ocotillo/asset/show/:id',
  //   meta: {
  //     label: 'Assets / Attachments',
  //     icon: <Image />,
  //   },
  // },
  {
    name: 'location',
    list: '/ocotillo/location',
    create: '/ocotillo/location/create',
    edit: '/ocotillo/location/edit/:id',
    show: '/ocotillo/location/show/:id',
    meta: {
      label: 'Locations',
      icon: <Place />,
    },
  },
  // {
  //   name: 'sensor',
  //   list: '/ocotillo/sensor',
  //   create: '/ocotillo/sensor/create',
  //   edit: '/ocotillo/sensor/edit/:id',
  //   show: '/ocotillo/sensor/show/:id',
  //   meta: {
  //     label: 'Sensors',
  //     icon: <SettingsInputAntenna />,
  //   },
  // },
  // {
  //   name: 'sample',
  //   list: '/ocotillo/sample',
  //   show: '/ocotillo/sample/show/:id',
  //   edit: '/ocotillo/sample/edit/:id',
  //   create: '/ocotillo/sample/create',
  //   meta: {
  //     label: 'Samples',
  //     icon: <ScienceOutlined />,
  //   },
  // },
  // {
  //   name: 'group',
  //   list: '/ocotillo/group',
  //   edit: '/ocotillo/group/edit/:id',
  //   show: '/ocotillo/group/show/:id',
  //   create: '/ocotillo/group/create',
  //   meta: {
  //     label: 'Groups',
  //     icon: <Workspaces />,
  //   },
  // },
  // {
  //   name: 'thing-id-link',
  //   list: '/ocotillo/thing-id-link',
  //   edit: '/ocotillo/thing-id-link/edit/:id',
  //   show: '/ocotillo/thing-id-link/show/:id',
  //   create: '/ocotillo/thing-id-link/create',
  //   meta: {
  //     disabled: false,
  //     label: 'Alternate ID links',
  //     icon: <Link />,
  //   },
  // },
  // {
  //   name: 'thing/well-screen',
  //   list: '/ocotillo/well-screen',
  //   edit: '/ocotillo/well-screen/edit/:id',
  //   show: '/ocotillo/well-screen/show/:id',
  //   create: '/ocotillo/well-screen/create',
  //   meta: {
  //     label: 'Well Screens',
  //     icon: <MoreVertOutlined />,
  //   },
  // },
  // {
  {
    name: 'lexicon',
    list: '/ocotillo/lexicon',
    meta: {
      disabled: false,
      label: 'Lexicon / Glossary',
      icon: <LibraryBooksOutlined />,
    },
  },
  //   name: 'lexicon/term',
  //   list: '/ocotillo/lexicon',
  //   edit: '/ocotillo/lexicon/term/edit/:id',
  //   show: '/ocotillo/lexicon/term/show/:id',
  //   create: '/ocotillo/lexicon/term/create',
  //   meta: {
  //     disabled: false,
  //     label: 'Lexicon / Glossary',
  //     icon: <LibraryBooksOutlined />,
  //   },
  // },
  // {
  //   name: 'lexicon/category',
  //   edit: '/ocotillo/lexicon/category/edit/:id',
  //   show: '/ocotillo/lexicon/category/show/:id',
  //   create: '/ocotillo/lexicon/category/create',
  //   meta: {
  //     disabled: false,
  //     label: 'Category',
  //     icon: <LibraryBooksOutlined />,
  //   },
  // },
]

tables.push({
  name: 'thing-well-pdf-preview',
  show: '/ocotillo/well/pdf-preview/:id',
  meta: {
    label: 'PDF Preview',
    parent: 'ocotillo.thing-well',
    nestedLevel: 3,
    hide: true,
  },
})

tables = tables.map((b) => {
  const meta: ResourceMeta = { ...b.meta }
  meta.nestedLevel = 0
  return {
    ...b,
    meta,
  }
})

tables.push({
  name: 'thing-well-batch-export',
  list: '/ocotillo/well/batch-export',
  meta: {
    label: 'Field Sheets',
    icon: <PictureAsPdfOutlined />,
  },
})

tables.push({
  name: 'thing-well-projects',
  list: '/ocotillo/well/projects',
  show: '/ocotillo/well/projects/show/:id',
  meta: {
    label: 'Projects',
    icon: <Workspaces />,
    parent: 'ocotillo.thing-well',
    nestedLevel: 1,
  },
})

tables.push({
  name: 'asset-unassociated',
  list: '/ocotillo/asset/unassociated',
  meta: {
    label: 'Unassociated Assets',
    icon: <Image />,
  },
})

let forms: {
  name: string
  edit?: string
  show?: string
  create?: string
  list: string
  meta: ResourceMeta
}[] = [
  {
    name: 'well-inventory-form',
    list: '/ocotillo/well-inventory-form',
    create: '/ocotillo/well-inventory-form/create',
    edit: '/ocotillo/well-inventory-form/edit/:id',
    show: '/ocotillo/well-inventory-form/show/:id',
    meta: {
      disabled: true,
      label: 'Well Inventory Form (Coming Soon)',
      icon: <Construction />,
    },
  },
  {
    name: 'groundwater-level-form',
    list: '/ocotillo/groundwater-level-form',
    create: '/ocotillo/groundwater-level-form/create',
    edit: '/ocotillo/groundwater-level-form/edit/:id',
    show: '/ocotillo/groundwater-level-form/show/:id',
    meta: {
      disabled: true,
      label: 'Groundwater Level Form (Coming Soon)',
      icon: <Construction />,
    },
  },
]

forms = forms.map((b) => {
  const meta: ResourceMeta = { ...b.meta }
  if (!meta.parent) {
    meta.parent = 'ocotillo.forms'
  }
  meta.nestedLevel = 2
  return {
    ...b,
    meta,
  }
})

let observations: {
  name: string
  edit?: string
  show?: string
  create?: string
  list: string
  meta: ResourceMeta
}[] = [
  {
    name: 'groundwater-level-observation',
    list: '/ocotillo/groundwater-level-observation',
    create: '/ocotillo/groundwater-level-observation/create',
    meta: {
      label: 'Groundwater Levels',
      icon: <Construction />,
    },
  },
]

observations = observations.map((b) => {
  const meta: ResourceMeta = { ...b.meta }
  if (!meta.parent) {
    meta.parent = 'ocotillo.observation'
  }
  meta.nestedLevel = 3
  return {
    ...b,
    meta,
  }
})

const ocotillo = [
  {
    name: 'map',
    list: '/ocotillo/map',
    meta: {
      label: 'Map',
      icon: <Map />,
    },
  },
  {
    name: 'collections',
    list: '/ocotillo/collections',
    meta: {
      label: 'Datasets',
      icon: <DatasetLinked />,
    },
  },
  ...tables,
  {
    name: 'hydrograph-correction',
    list: '/ocotillo/hydrograph-correction',
    meta: {
      label: 'Hydrograph Correction',
      icon: <Timeline />,
    },
  },
  {
    name: 'chemistry-report',
    list: '/ocotillo/chemistry-report',
    meta: {
      label: 'Chemistry Reports',
      icon: <ScienceOutlined />,
    },
  },
  {
    name: 'observation',
    icon: <ScaleOutlined />,
    meta: {
      nestedLevel: 0,
      label: 'Observations',
    },
  },
  // ...observations,
  // {
  //   name: 'water-chemistry-import',
  //   list: '/ocotillo/water-chemistry-import',
  //   meta: {
  //     disabled: true,
  //     label: 'Water Chemistry Import (Coming Soon)',
  //     parent: 'ocotillo.apps',
  //     nestedLevel: 2,
  //     icon: <ScienceOutlined />,
  //   },
  // },
  // {
  //   name: 'forms',
  //   icon: <DynamicFormOutlined />,
  //   meta: {
  //     label: 'Forms',
  //   },
  // },
  // ...forms,
]

export const ocotilloResources = ocotillo.map((b) => {
  const meta: ResourceMeta = { ...b.meta }
  meta.dataProviderName = 'ocotillo'
  return {
    ...b,
    name: `ocotillo.${b.name}`,
    meta,
  }
})

if (!import.meta.env.PROD) {
  console.debug({ ocotilloResources })
}
