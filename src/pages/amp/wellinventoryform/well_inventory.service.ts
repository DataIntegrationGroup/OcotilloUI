import { getAccessToken } from "@/providers/fief-provider";
import {
  lookupTableFetchConfig,
  lookupTableQueryConfig,
} from "./well_inventory.configs";
import { useQuery } from "@tanstack/react-query";

const fetchProjectOptions = async (): Promise<
  {
    Project: string;
    PointIDPrefix: string[];
  }[]
> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/project",
    lookupTableFetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch project options");
  }

  return response.json();
};

export const getProjectOptions = () => {
  return useQuery({
    queryKey: ["ProjectNames"],
    queryFn: fetchProjectOptions,
    ...lookupTableQueryConfig,
  });
};

const fetchMonitoringStatusOptions = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/monitoring_status",
    lookupTableFetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch monitoring status options");
  }

  return response.json();
};

export const getMonitoringStatusOptions = () => {
  return useQuery({
    queryKey: ["MonitoringStatuses"],
    queryFn: fetchMonitoringStatusOptions,
    ...lookupTableQueryConfig,
  });
};
