import DashboardOutlined from "@mui/icons-material/DashboardOutlined";

const criticalminerals = [
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
  const meta = g.meta || {};
  meta["parent"] = "criticalminerals";
  meta["dataProviderName"] = "criticalminerals";

  return {
    ...g,
    meta: meta,
  };
});
