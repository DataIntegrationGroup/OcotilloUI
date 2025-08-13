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
} from '@mui/icons-material'

let ocotillo = [
  {
    name: 'asset',
    list: '/ocotillo/asset',
    create: '/ocotillo/asset/create',
    edit: '/ocotillo/asset/edit/:id',
    show: '/ocotillo/asset/show/:id',
    meta: {
      label: 'Assets',
      icon: <Image />,
    },
  },
  {
    name: 'contact',
    list: '/ocotillo/contact',
    edit: '/ocotillo/contact/edit/:id',
    show: '/ocotillo/contact/show/:id',
    create: '/ocotillo/contact/create',
    icon: <Contacts />,
    meta: {
      label: 'Contacts',
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
    name: 'map',
    list: '/ocotillo/map',
    meta: {
      label: 'Map',
      icon: <Map />,
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
      icon: <CategoryOutlined />,
    },
  },
  {
    name: 'lexicon',
    list: '/ocotillo/lexicon',
    edit: '/ocotillo/lexicon/edit/:id',
    show: '/ocotillo/lexicon/show/:id',
    create: '/ocotillo/lexicon/create',
    meta: {
      label: 'Lexicon',
      icon: <CategoryOutlined />,
    },
  },
  {
    name: 'thing',
    icon: <WidgetsOutlined />,
    meta: {
      label: 'Things',
    },
  },
  {
    name: 'thing-well',
    list: '/ocotillo/well',
    edit: '/ocotillo/well/edit/:id',
    show: '/ocotillo/well/show/:id',
    create: '/ocotillo/well/create',
    meta: {
      label: 'Wells',
      parent: 'ocotillo.thing',
      nestedLevel: 2,
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
      parent: 'ocotillo.thing',
      nestedLevel: 2,
      icon: <Construction />,
    },
  },
  {
    name: 'observation',
    icon: <ScaleOutlined />,
    meta: {
      label: 'Observations',
    },
  },
  {
    name: 'groundwater-level-observation',
    list: '/ocotillo/groundwater-level-observation',
    create: '/ocotillo/groundwater-level-observation/create',
    // edit: '/ocotillo/observation/edit/:id',
    // show: '/ocotillo/observation/show/:id',
    meta: {
      parent: 'ocotillo.observation',
      nestedLevel: 2,
      label: 'Groundwater Levels',
    },
  },

  // Apps
  {
    name: 'apps',
    icon: <Apps />,
    meta: {
      label: 'Apps',
    },
  },
  {
    name: 'HygrographCorrector',
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
    name: 'Water Chemistry Import',
    list: '/ocotillo/water-chemistry-import',
    meta: {
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
  {
    name: 'well-inventory-form',
    list: '/ocotillo/well-inventory-form',
    create: '/ocotillo/well-inventory-form/create',
    edit: '/ocotillo/well-inventory-form/edit/:id',
    show: '/ocotillo/well-inventory-form/show/:id',
    meta: {
      disabled: false,
      label: 'Well Inventory Form',
      parent: 'ocotillo.forms',
      nestedLevel: 2,
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
      // disabled: true,
      label: 'Groundwater Level Form (Beta)',
      parent: 'ocotillo.forms',
      nestedLevel: 2,
      icon: <Construction />,
    },
  },

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
