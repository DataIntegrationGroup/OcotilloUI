import {
  CategoryOutlined,
  Place,
  Construction,
  DashboardOutlined,
  SettingsInputAntenna,
  ScaleOutlined,
  WidgetsOutlined,
  Contacts,
  Apps,
  DynamicFormOutlined,
  Map,
} from '@mui/icons-material'

let dataforge = [
  {
    name: 'contact',
    list: '/dataforge/contact',
    edit: '/dataforge/contact/edit/:id',
    show: '/dataforge/contact/show/:id',
    create: '/dataforge/contact/create',
    icon: <Contacts />,
    meta: {
      label: 'Contacts',
    },
  },
  {
    name: 'location',
    list: '/dataforge/location',
    create: '/dataforge/location/create',
    edit: '/dataforge/location/edit/:id',
    show: '/dataforge/location/show/:id',
    meta: {
      label: 'Locations',
      icon: <Place />,
    },
  },
  {
    name: 'sensor',
    list: '/dataforge/sensor',
    create: '/dataforge/sensor/create',
    edit: '/dataforge/sensor/edit/:id',
    show: '/dataforge/sensor/show/:id',
    meta: {
      label: 'Sensors',
      icon: <SettingsInputAntenna />,
    },
  },
  {
    name: 'map',
    list: '/dataforge/map',
    meta: {
      label: 'Map',
      icon: <Map />,
    },
  },
  {
    name: 'group',
    list: '/dataforge/group',
    edit: '/dataforge/group/edit/:id',
    show: '/dataforge/group/show/:id',
    create: '/dataforge/group/create',
    meta: {
      label: 'Groups',
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
    name: 'thing/well',
    list: '/dataforge/well',
    edit: '/dataforge/well/edit/:id',
    show: '/dataforge/well/show/:id',
    create: '/dataforge/well/create',
    meta: {
      label: 'Wells',
      parent: 'dataforge.thing',
      nestedLevel: 2,
      icon: <Construction />,
    },
  },
  {
    name: 'thing/spring',
    list: '/dataforge/spring',
    edit: '/dataforge/spring/edit/:id',
    show: '/dataforge/spring/show/:id',
    create: '/dataforge/spring/create',
    meta: {
      label: 'Springs',
      parent: 'dataforge.thing',
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
    list: '/dataforge/groundwater-level-observation',
    create: '/dataforge/groundwater-level-observation/create',
    // edit: '/dataforge/observation/edit/:id',
    // show: '/dataforge/observation/show/:id',
    meta: {
      parent: 'dataforge.observation',
      nestedLevel: 2,
      label: 'Groundwater Levels',
    },
  },
  {
    name: 'apps',
    icon: <Apps />,
    meta: {
      label: 'Apps',
    },
  },
  {
    name: 'HygrographCorrector',
    list: '/dataforge/hydrograph-corrector',
    meta: {
      disabled: true,
      label: 'Hydrograph Corrector (Coming Soon)',
      parent: 'dataforge.apps',
      nestedLevel: 2,
      icon: <Construction />,
    },
  },
  {
    name: 'forms',
    icon: <DynamicFormOutlined />,
    meta: {
      label: 'Forms',
    },
  },
  {
    name: 'well-inventory-form',
    list: '/dataforge/well-inventory-form',
    create: '/dataforge/well-inventory-form/create',
    edit: '/dataforge/well-inventory-form/edit/:id',
    show: '/dataforge/well-inventory-form/show/:id',
    meta: {
      disabled: true,
      label: 'Well Inventory Form (Beta)',
      parent: 'dataforge.forms',
      nestedLevel: 2,
      icon: <Construction />,
    },
  },
  {
    name: 'water-level-form',
    list: '/dataforge/water-level-form',
    create: '/dataforge/water-level-form/create',
    edit: '/dataforge/water-level-form/edit/:id',
    show: '/dataforge/water-level-form/show/:id',
    meta: {
      disabled: true,
      label: 'Water Level Form (Coming Soon)',
      parent: 'dataforge.forms',
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

export const dataforgeResources = dataforge.map((b) => {
  let meta = b.meta || {}
  if (!meta['parent']) {
    meta['parent'] = 'dataforge'
  }
  meta['dataProviderName'] = 'dataforge'
  return {
    ...b,
    name: `dataforge.${b.name}`,
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
