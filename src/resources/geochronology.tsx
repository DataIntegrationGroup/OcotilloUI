import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import Science from "@mui/icons-material/Science";
import CookieOutlined from "@mui/icons-material/CookieOutlined";
import type { ResourceMeta } from "./types";

const geochronology: {
  name: string;
  list?: string;
  show?: string;
  create?: string;
  icon?: JSX.Element;
  meta?: ResourceMeta;
}[] = [
  {
    name: "dashboard",
    list: "/geochronology/dashboard",
    meta: {
      label: "Dashboard",
      icon: <DashboardOutlined />,
    },
  },
  {
    name: "principal_investigators",
    list: "/geochronology/principal_investigators",
    show: "/geochronology/principal_investigators/show/:id",
    create: "/geochronology/principal_investigators/create",
    icon: <PersonOutlined />,
    meta: {
      parent: "geochronology",
      label: "Principal Investigators",
      dataProviderName: "geochronology",
    },
  },
  {
    name: "projects",
    list: "/geochronology/projects",
    show: "/geochronology/projects/show/:id",
    create: "/geochronology/projects/create",
    icon: <CategoryOutlined />,
    meta: { parent: "geochronology", dataProviderName: "geochronology" },
  },
  {
    name: "materials",
    list: "/geochronology/materials",
    show: "/geochronology/materials/show/:id",
    create: "/geochronology/materials/create",
    icon: <Science />,
  },
  {
    name: "samples",
    list: "/geochronology/samples",
    show: "/geochronology/samples/show/:id",
    create: "/geochronology/samples/create",
    icon: <CookieOutlined />,
  },
];

export const geochronologyResources = geochronology.map((g) => {
  const meta: ResourceMeta = { ...g.meta };
  meta.parent = "geochronology";
  meta.dataProviderName = "geochronology";

  return {
    ...g,
    meta,
  };
});
