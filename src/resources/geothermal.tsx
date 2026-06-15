import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import type { ResourceMeta } from "./types";

const geothermal: {
    name: string;
    list?: string;
    show?: string;
    icon?: JSX.Element;
    meta?: ResourceMeta;
}[] = [
    {
        name: "dashboard",
        list: "/geothermal/dashboard",
        icon: <DashboardOutlined/>,
        meta: {
            label: "Dashboard",
        },
    },
    {
        name: "geothermal_wells",
        list: "/geothermal/wells",
        show: "/geothermal/wells/show/:id",
        icon: <DashboardOutlined/>,
        meta: {
            label: "Wells",
        },
    },
];

export const geothermalResources = geothermal.map((g) => {
    const meta: ResourceMeta = { ...g.meta };
    meta.parent = "geothermal";
    meta.dataProviderName = "geothermal";

    return {
        ...g,
        name: `geothermal.${g.name}`,
        meta,
    };
});
