import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import type { ResourceMeta } from "./types";

const criticalminerals: {
  name: string;
  list?: string;
  icon?: JSX.Element;
  meta?: ResourceMeta;
}[] = [
  {
    name: "dashboard",
    list: "/criticalminerals/dashboard",
    icon: <DashboardOutlined />,
    meta: {
      label: "Dashboard",
    },
  },
];

export const criticalMineralResources = criticalminerals.map((g) => {
  const meta: ResourceMeta = { ...g.meta };
  meta.parent = "criticalminerals";
  meta.dataProviderName = "criticalminerals";

  return {
    ...g,
    meta,
  };
});
