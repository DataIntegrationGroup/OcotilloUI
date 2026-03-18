import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import Construction from "@mui/icons-material/Construction";
import Place from "@mui/icons-material/Place";
import Plumbing from "@mui/icons-material/Plumbing";
import Cable from "@mui/icons-material/Cable";
import Water from "@mui/icons-material/Water";
import TableViewIcon from "@mui/icons-material/TableView";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import { DynamicFormTwoTone } from "@mui/icons-material";

let amp = [
  {
    name: "Sandbox",
    meta: {
      label: "Sandbox",
    },
  },
  {
    name: "dashboard",
    list: "/amp/dashboard",
    meta: {
      label: "Dashboard (Coming Soon)",
      icon: <DashboardOutlined />,
      wip: true,
    },
  },
  {
    name: "hydrographcorrector",
    list: "/amp/hydrographcorrector",
    meta: {
      label: "Hydrograph Corrector (Coming Soon)",
      icon: <Construction />,
      wip: true,
    },
  },
  {
    name: "reportbuilder",
    list: "/amp/reportbuilder",
    meta: {
      label: "Report Builder (Not Available)",
      icon: <Construction />,
      wip: true,
    },
  },
  {
    name: "querybuilder",
    list: "/amp/querybuilder",
    meta: {
      label: "Query Builder (Coming Soon)",
      icon: <Construction />,
      wip: true,
    },
  },
  {
    name: "wellinventoryform",
    list: "/amp/wellinventoryform",
    meta: {
      label: "Well Inventory Form (Beta)",
      icon: <DynamicFormTwoTone />,
      wip: true,
    },
  },
  {
    name: "waterlevelform",
    list: "/amp/waterlevelform",
    meta: {
      label: "Water Level Form (Beta)",
      icon: <Water />,
      wip: true,
    },
  },
  {
    name: "projects",
    list: "/amp/projects",
    meta: {
      label: "Projects (Coming Soon)",
      icon: <CategoryOutlined />,
      wip: true,
    },
  },

  {
    name: "locations",
    icon: <Place />,
    list: "/amp/locations",
    edit: "/amp/locations/edit/:id",
    show: "/amp/locations/show/:id",
    create: "/amp/locations/create",
    meta: {
      label: "Locations (Coming Soon)",
      wip: true,
    },
  },
  {
    name: "wells",
    icon: <Plumbing />,
    list: "/amp/wells",
    edit: "/amp/wells/edit/:id",
    show: "/amp/wells/show/:id",
    create: "/amp/wells/create",
    meta: {
      label: "Wells (Coming Soon)",
      wip: true,
    },
  },
  {
    name: "equipment",
    icon: <Cable />,
    list: "/amp/equipment",
    edit: "/amp/equipment/edit/:id",
    create: "/amp/equipment/create",
    show: "/amp/equipment/show/:id",
    meta: {
      label: "Equipment (Coming Soon)",
      wip: true,
    },
  },
  {
    name: "manual_waterlevels",
    list: "/amp/manualwaterlevels",
    edit: "/amp/manualwaterlevels/edit/:id",
    create: "/amp/manualwaterlevels/create",
    show: "/amp/manualwaterlevels/show/:id",
    meta: {
      label: "Manual Water Levels (Coming Soon)",
      wip: true,
    },
  },
  {
    name: "batchupload",
    icon: <FileUploadOutlined />,
    meta: {
      label: "Batch Upload",
    },
  },
  {
    name: "chemupload",
    list: "/amp/chemupload",
    icon: <ScienceOutlined />,
    meta: {
      parent: "water.batchupload",
      nestedLevel: 2,
      label: "Chemistry Upload (Beta)",
      wip: true,
    },
  },
  {
    name: "manualwaterlevels_batchupload",
    list: "/amp/manualwaterlevels/batchupload",
    icon: <Water />,
    meta: {
      label: "Manual Water Levels (Beta)",
      parent: "water.batchupload",
      nestedLevel: 2,
      wip: true,
    },
  },
  {
    name: "Chemistry",
    icon: <ScienceOutlined />,
    meta: {
      label: "Chemistry",
    },
  },
  {
    name: "LookupTables",
    icon: <TableViewIcon />,
    meta: {
      label: "Lookup Tables",
    },
  },
];

export const ampResources = amp.map((b) => {
  let meta = b.meta || {};
  if (!meta["parent"]) {
    meta["parent"] = "Sandbox";
  }
  meta["dataProviderName"] = "amp";
  return {
    ...b,
    name: `water.${b.name}`,
    meta: meta,
  };
});

const lookupKeys = [
  { key: "level_status", label: "Level Status" },
  { key: "measurement_method", label: "Measurement Method" },
  { key: "data_quality", label: "Data Quality" },
  { key: "measuring_agency", label: "Measuring Agency" },
  { key: "data_source", label: "Data Source" },
];

const lookupResources = lookupKeys.map((l) => {
  return {
    name: `water.${l.key}`,
    list: `/amp/lu_${l.key}`,
    meta: {
      dataProviderName: 'amp',
      parent: "water.LookupTables",
      nestedLevel: 2,
      label: l.label,
    },
  };
});

export const allAmpResources = [...ampResources, ...lookupResources]
