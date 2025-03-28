import DashboardOutlined from "@mui/icons-material/DashboardOutlined";

let geothermal = [
  {
    name: "dashboard",
    list: "/geothermal/dashboard",
    icon: <DashboardOutlined />,
    meta: {
      label: "Dashboard",
    },
  },
  {
    name: "geothermal_wells",
    list: "/geothermal/wells",
    show: "/geothermal/wells/show/:id",
    icon: <DashboardOutlined />,
    meta: {
      label: "Wells",
    },
  },
];

export const geothermalResources = geothermal.map((g) => {
  let meta = g.meta || {};
  meta["parent"] = "geothermal";
  meta["dataProviderName"] = "geothermal";

  return {
    ...g,
    meta: meta,
  };
});
