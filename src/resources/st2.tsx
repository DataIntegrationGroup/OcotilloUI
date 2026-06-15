import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import Place from "@mui/icons-material/Place";
import Plumbing from "@mui/icons-material/Plumbing";
import { WaterOutlined } from "@mui/icons-material";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import type { ResourceMeta } from "./types";

const st2: {
  name: string;
  list?: string;
  icon?: JSX.Element;
  meta?: ResourceMeta;
}[] = [
  {
    name: "dashboard",
    list: "/st2/dashboard",
    meta: {
      label: "Dashboard",
      icon: <DashboardOutlined />,
    },
  },
  {
    name: "locations",
    icon: <Place />,
    list: "/st2/locations",
    // edit: "/st2/locations/edit/:id",
    // show: "/st2/locations/show/:id",
    // create: "/st2/locations/create",
  },
  {
    name: "wells",
    icon: <Plumbing />,
    list: "/st2/wells",
    // edit: "/st2/wells/edit/:id",
    // show: "/st2/wells/show/:id",
    // create: "/st2/wells/create",
  },
  {
    name: "datastreams",
    icon: <WaterOutlined />,
    list: "/st2/datastreams",
    // edit: "/st2/datastreams/edit/:id",
    // show: "/st2/datastreams/show/:id",
    // create: "/st2/datastreams/create",
  },
  {
    name: "sensors",
    icon: <SensorsOutlinedIcon />,
    list: "/st2/sensors",
  },
  {
    name: "observedproperties",
    list: "/st2/observedproperties",
    meta: {
      label: "ObservedProperties",
      icon: <BiotechOutlinedIcon />,
    },
  },
];

export const st2Resources = st2.map((b) => {
  const meta: ResourceMeta = { ...b.meta };
  if (!meta.parent) {
    meta.parent = "st2";
  }
  meta.dataProviderName = "st2";
  return {
    ...b,
    meta,
  };
});
