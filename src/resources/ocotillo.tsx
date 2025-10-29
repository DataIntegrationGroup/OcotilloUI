import {
  CategoryOutlined,
  Place,
  Construction,
  DashboardOutlined,
  ScienceOutlined,
  SettingsInputAntenna,
  ScaleOutlined,
  WidgetsOutlined,
  Contacts,
  Apps,
  DynamicFormOutlined,
  Map,
  Image,
  Link,
  Spa,
  Workspaces,
  MoreVertOutlined,
  LibraryBooksOutlined,
} from '@mui/icons-material'

let tables: {
  name: string
  edit?: string
  show?: string
  create?: string
  list?: string
  meta: { label?: string; icon?: JSX.Element; disabled?: boolean }
}[] = [
  {
    name: 'thing-well',
    list: '/ocotillo/well',
    edit: '/ocotillo/well/edit/:id',
    show: '/ocotillo/well/show/:id',
    create: '/ocotillo/well/create',
    meta: {
      label: 'Wells',
      icon: <Construction />,
    },
  },
  {
    name: 'thing-spring',
    list: '/ocotillo/spring',
    edit: '/ocotillo/spring/edit/:id',
    show: '/ocotillo/spring/show/:id',
    create: '/ocotillo/spring/create',
    meta: {
      label: 'Springs',
      icon: <Spa />,
    },
  },
  {
    name: 'contact',
    list: '/ocotillo/contact',
    edit: '/ocotillo/contact/edit/:id',
    show: '/ocotillo/contact/show/:id',
    create: '/ocotillo/contact/create',
    meta: {
      icon: <Contacts />,
      label: 'Contacts / Owners',
    },
  },
  {
    name: 'group',
    list: '/ocotillo/group',
    edit: '/ocotillo/group/edit/:id',
    show: '/ocotillo/group/show/:id',
    create: '/ocotillo/group/create',
    meta: {
      label: 'Groups / Projects',
      icon: <Workspaces />,
    },
  },
  {
    name: 'asset',
    list: '/ocotillo/asset',
    create: '/ocotillo/asset/create',
    edit: '/ocotillo/asset/edit/:id',
    show: '/ocotillo/asset/show/:id',
    meta: {
      label: 'Assets / Attachments',
      icon: <Image />,
    },
  },
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
  {
    name: 'sensor',
    list: '/ocotillo/sensor',
    create: '/ocotillo/sensor/create',
    edit: '/ocotillo/sensor/edit/:id',
    show: '/ocotillo/sensor/show/:id',
    meta: {
      label: 'Sensors',
      icon: <SettingsInputAntenna />,
    },
  },
  {
    name: 'sample',
    list: '/ocotillo/sample',
    show: '/ocotillo/sample/show/:id',
    edit: '/ocotillo/sample/edit/:id',
    create: '/ocotillo/sample/create',
    meta: {
      label: 'Samples',
      icon: <ScienceOutlined />,
    },
  },
  {
    name: 'group',
    list: '/ocotillo/group',
    edit: '/ocotillo/group/edit/:id',
    show: '/ocotillo/group/show/:id',
    create: '/ocotillo/group/create',
    meta: {
      label: 'Groups',
      icon: <Workspaces />,
    },
  },
  {
    name: 'thing-id-link',
    list: '/ocotillo/thing-id-link',
    edit: '/ocotillo/thing-id-link/edit/:id',
    show: '/ocotillo/thing-id-link/show/:id',
    create: '/ocotillo/thing-id-link/create',
    meta: {
      disabled: false,
      label: 'Alternate ID links',
      icon: <Link />,
    },
  },
  {
    name: 'thing/well-screen',
    list: '/ocotillo/well-screen',
    edit: '/ocotillo/well-screen/edit/:id',
    show: '/ocotillo/well-screen/show/:id',
    create: '/ocotillo/well-screen/create',
    meta: {
      label: 'Well Screens',
      icon: <MoreVertOutlined />,
    },
  },
  {
    name: 'lexicon/term',
    list: '/ocotillo/lexicon',
    edit: '/ocotillo/lexicon/term/edit/:id',
    show: '/ocotillo/lexicon/term/show/:id',
    create: '/ocotillo/lexicon/term/create',
    meta: {
      disabled: false,
      label: 'Lexicon / Glossary',
      icon: <LibraryBooksOutlined />,
    },
  },
  {
    name: 'lexicon/category',
    edit: '/ocotillo/lexicon/category/edit/:id',
    show: '/ocotillo/lexicon/category/show/:id',
    create: '/ocotillo/lexicon/category/create',
    meta: {
      disabled: false,
      label: 'Category',
      icon: <LibraryBooksOutlined />,
    },
  },
]

tables = tables.map((b) => {
  let meta = b.meta || {}
  if (!meta['parent']) {
    meta['parent'] = 'ocotillo.tables'
  }
  meta['nestedLevel'] = 2
  return {
    ...b,
    meta: meta,
  }
})

let forms: {
  name: string
  edit?: string
  show?: string
  create?: string
  list: string
  meta: { label?: string; icon?: JSX.Element; disabled?: boolean }
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
  let meta = b.meta || {}
  if (!meta['parent']) {
    meta['parent'] = 'ocotillo.forms'
  }
  meta['nestedLevel'] = 2
  return {
    ...b,
    meta: meta,
  }
})

let observations: {
  name: string
  edit?: string
  show?: string
  create?: string
  list: string
  meta: { label?: string; icon?: JSX.Element }
}[] = [
  {
    name: 'groundwater-level-observation',
    list: '/ocotillo/groundwater-level-observation',
    create: '/ocotillo/groundwater-level-observation/create',
    // edit: '/ocotillo/observation/edit/:id',
    // show: '/ocotillo/observation/show/:id',
    meta: {
      label: 'Groundwater Levels',
      icon: <Construction />,
    },
  },
]

observations = observations.map((b) => {
  let meta = b.meta || {}
  if (!meta['parent']) {
    meta['parent'] = 'ocotillo.observation'
  }
  meta['nestedLevel'] = 3
  return {
    ...b,
    meta: meta,
  }
})

let ocotillo = [
  {
    name: 'map',
    list: '/ocotillo/map',
    meta: {
      label: 'Map',
      icon: <Map />,
    },
  },

  // tables
  {
    name: 'tables',
    icon: <WidgetsOutlined />,
    meta: {
      label: 'Tables',
    },
  },
  ...tables,

  {
    name: 'observation',
    icon: <ScaleOutlined />,
    meta: {
      parent: 'ocotillo.tables',
      nestedLevel: 2,
      label: 'Observations',
    },
  },
  ...observations,
  // Apps
  {
    name: 'apps',
    icon: <Apps />,
    meta: {
      label: 'Apps',
    },
  },
  {
    name: 'hydrograph-corrector',
    list: '/ocotillo/hydrograph-corrector',
    meta: {
      disabled: true,
      label: 'Hydrograph Corrector (Coming Soon)',
      parent: 'ocotillo.apps',
      nestedLevel: 2,
      icon: <Construction />,
    },
  },
  {
    name: 'water-chemistry-import',
    list: '/ocotillo/water-chemistry-import',
    meta: {
      disabled: true,
      label: 'Water Chemistry Import (Coming Soon)',
      parent: 'ocotillo.apps',
      nestedLevel: 2,
      icon: <ScienceOutlined />,
    },
  },

  // Forms
  {
    name: 'forms',
    icon: <DynamicFormOutlined />,
    meta: {
      label: 'Forms',
    },
  },
  ...forms,

  // {
  //   name: 'Apps',
  //   icon: <WidgetsOutlined />,
  //   meta: {
  //     label: 'Things',
  //   },
  // },
]

export const ocotilloResources = ocotillo.map((b) => {
  let meta = b.meta || {}
  if (!meta['parent']) {
    meta['parent'] = 'ocotillo'
  }
  meta['dataProviderName'] = 'ocotillo'
  return {
    ...b,
    name: `ocotillo.${b.name}`,
    meta: meta,
  }
})

console.log(ocotilloResources)
//
// let amp = [
//   {
//     name: "dashboard",
//     list: "/amp/dashboard",
//     meta: {
//       label: "Dashboard",
//       icon: <DashboardOutlined />,
//     },
//   },
//   {
//     name: "hydrographcorrector",
//     list: "/amp/hydrographcorrector",
//     meta: {
//       label: "Hydrograph Corrector (Coming Soon)",
//       icon: <Construction />,
//     },
//   },
//   {
//     name: "reportbuilder",
//     list: "/amp/reportbuilder",
//     meta: {
//       label: "Report Builder (Coming Soon)",
//       icon: <Construction />,
//     },
//   },
//   {
//     name: "querybuilder",
//     list: "/amp/querybuilder",
//     meta: {
//       label: "Query Builder (Beta)",
//       icon: <Construction />,
//     },
//   },
//   {
//     name: "wellinventoryform",
//     list: "/amp/wellinventoryform",
//     meta: {
//       label: "Well Inventory Form (Beta)",
//       icon: <DynamicFormTwoTone />,
//     },
//   },
//   {
//     name: "waterlevelform",
//     list: "/amp/waterlevelform",
//     meta: {
//       label: "Water Level Form (Beta)",
//       icon: <Water />,
//     },
//   },
//   {
//     name: "projects",
//     list: "/amp/projects",
//     icon: <CategoryOutlined />,
//     meta: {
//       label: "Projects",
//     },
//   },
//
//   {
//     name: "locations",
//     icon: <Place />,
//     list: "/amp/locations",
//     edit: "/amp/locations/edit/:id",
//     show: "/amp/locations/show/:id",
//     create: "/amp/locations/create",
//     meta: {
//       label: "Locations",
//     },
//   },
//   {
//     name: "wells",
//     icon: <Plumbing />,
//     list: "/amp/wells",
//     edit: "/amp/wells/edit/:id",
//     show: "/amp/wells/show/:id",
//     create: "/amp/wells/create",
//     meta: {
//       label: "Wells",
//     },
//   },
//   {
//     name: "equipment",
//     icon: <Cable />,
//     list: "/amp/equipment",
//     edit: "/amp/equipment/edit/:id",
//     create: "/amp/equipment/create",
//     show: "/amp/equipment/show/:id",
//     meta: {
//       label: "Equipment",
//     },
//   },
//   {
//     name: "manual_waterlevels",
//     list: "/amp/manualwaterlevels",
//     edit: "/amp/manualwaterlevels/edit/:id",
//     create: "/amp/manualwaterlevels/create",
//     show: "/amp/manualwaterlevels/show/:id",
//     meta: {
//       label: "Manual Water Levels",
//     },
//   },
//   {
//     name: "batchupload",
//     icon: <FileUploadOutlined />,
//     meta: {
//       label: "Batch Upload",
//     },
//   },
//   {
//     name: "chemupload",
//     list: "/amp/chemupload",
//     icon: <ScienceOutlined />,
//     meta: {
//       parent: "water.batchupload",
//       nestedLevel: 2,
//       label: "Chemistry Upload (Beta)",
//     },
//   },
//   {
//     name: "manualwaterlevels_batchupload",
//     list: "/amp/manualwaterlevels/batchupload",
//     icon: <Water />,
//     meta: {
//       label: "Manual Water Levels (Beta)",
//       parent: "water.batchupload",
//       nestedLevel: 2,
//     },
//   },
//   {
//     name: "Chemistry",
//     icon: <ScienceOutlined />,
//     meta: {
//       label: "Chemistry",
//     },
//   },
//   {
//     name: "LookupTables",
//     icon: <TableViewIcon />,
//     meta: {
//       label: "Lookup Tables",
//     },
//   },
// ];
//
// export const ampResources = amp.map((b) => {
//   let meta = b.meta || {};
//   if (!meta["parent"]) {
//     meta["parent"] = "water";
//   }
//   meta["dataProviderName"] = "amp";
//   return {
//     ...b,
//     name: `water.${b.name}`,
//     meta: meta,
//   };
// });
//
// const lookupKeys = [
//   { key: "level_status", label: "Level Status" },
//   { key: "measurement_method", label: "Measurement Method" },
//   { key: "data_quality", label: "Data Quality" },
//   { key: "measuring_agency", label: "Measuring Agency" },
//   { key: "data_source", label: "Data Source" },
// ];
//
// export const lookup = lookupKeys.map((l) => {
//   return {
//     name: l.key,
//     list: `/amp/lu_${l.key}`,
//     meta: {
//       parent: "water.LookupTables",
//       nestedLevel: 2,
//       label: l.label,
//     },
//   };
// });
