import DashboardOutlined from "@mui/icons-material/DashboardOutlined";

let criticalminerals = [
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
  let meta = g.meta || {};
  meta["parent"] = "criticalminerals";
  meta["dataProviderName"] = "criticalminerals";

  return {
    ...g,
    meta: meta,
  };
});
