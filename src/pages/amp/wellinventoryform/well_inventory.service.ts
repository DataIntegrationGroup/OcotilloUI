import { getAccessToken } from "@/providers/fief-provider";
import {
  lookupTableFetchConfig,
  lookupTableQueryConfig,
} from "./well_inventory.configs";
import { useQuery } from "@tanstack/react-query";

const fetchProjects = async (): Promise<
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

export const getProjects = () => {
  return useQuery({
    queryKey: ["ProjectNames"],
    queryFn: fetchProjects,
    ...lookupTableQueryConfig,
  });
};

const fetchMonitoringStatuses = async (): Promise<
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

export const getMonitoringStatuses = () => {
  return useQuery({
    queryKey: ["MonitoringStatuses"],
    queryFn: fetchMonitoringStatuses,
    ...lookupTableQueryConfig,
  });
};

const fetchCoordinateDatums = async (): Promise<{ DATUMCODE: string }[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/coordinate_datum",
    lookupTableFetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch coordinate datum options");
  }

  return response.json();
};

export const getCoordinateDatums = () => {
  return useQuery({
    queryKey: ["CoordinateDatums"],
    queryFn: fetchCoordinateDatums,
    ...lookupTableQueryConfig,
  });
};

const fetchAltitudeDatums = async (): Promise<{ Code: string }[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/altitude_datum",
    lookupTableFetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch altitude datum options");
  }

  return response.json();
};

export const getAltitudeDatums = () => {
  return useQuery({
    queryKey: ["AltitudeDatums"],
    queryFn: fetchAltitudeDatums,
    ...lookupTableQueryConfig,
  });
};

const fetchAltitudeMethods = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/altitude_method",
    lookupTableFetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch altitude method options");
  }

  return response.json();
};

export const getAltitudeMethods = () => {
  return useQuery({
    queryKey: ["AltitudeMethods"],
    queryFn: fetchAltitudeMethods,
    ...lookupTableQueryConfig,
  });
};

const fetchFormations = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/formation",
    lookupTableFetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch formation options");
  }

  return response.json();
};

export const getFormations = () => {
  return useQuery({
    queryKey: ["Formations"],
    queryFn: fetchFormations,
    ...lookupTableQueryConfig,
  });
};
