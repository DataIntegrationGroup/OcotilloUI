import { getAccessToken } from "@/providers/fief-provider";
import { fetchConfig, lookupTableQueryConfig } from "./well_inventory.configs";
import { useQuery } from "@tanstack/react-query";
import { ILocation, IOwner, IWellInventoryForm, Page } from "@/interfaces";

const fetchProjects = async (): Promise<
  {
    Project: string;
    PointIDPrefix: string[];
  }[]
> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/project",
    fetchConfig(accessToken),
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
    fetchConfig(accessToken),
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
    fetchConfig(accessToken),
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
    fetchConfig(accessToken),
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
    fetchConfig(accessToken),
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
    fetchConfig(accessToken),
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

const fetchSiteTypes = async (): Promise<
  { Code: string; Meaning: string }[]
> => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    "/api/v0/authorized/lookuptable/site_type",
    fetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch site type options");
  }

  return response.json();
};

export const getSiteTypes = () => {
  return useQuery({
    queryKey: ["SiteTypes"],
    queryFn: fetchSiteTypes,
    ...lookupTableQueryConfig,
  });
};

const fetchNewPointIDPreview = async (prefix: string) => {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `/api/v0/authorized/well_inventory/newly_generated_pointid?pointid_prefix=${encodeURIComponent(prefix)}`,
    fetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error("Failed to fetch new Point ID preview");
  }

  return response.json();
};

export const getNewPointIDPreview = (prefix: string) => {
  return useQuery({
    queryKey: ["PointIDPreview", prefix],
    queryFn: () => fetchNewPointIDPreview(prefix),
    enabled: !!prefix,
  });
};

export const createWellInventoryForm = async (
  body: Partial<IWellInventoryForm>,
) => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/authorized/well_inventory", {
    ...fetchConfig(accessToken, "POST"),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Failed to create new well inventory entry");
  }

  return response.json();
};

const fetchOwnerSearch = async ({
  owner_key_like = "",
  first_name_like = "",
  last_name_like = "",
  email_like = "",
  phone_like = "",
  cell_phone_like = "",
  limit = 10,
  expand = false,
  page = 1,
  size = 10,
}: {
  owner_key_like?: string;
  first_name_like?: string;
  last_name_like?: string;
  email_like?: string;
  phone_like?: string;
  cell_phone_like?: string;
  limit?: number;
  expand?: boolean;
  page?: number;
  size?: number;
}): Promise<
  Page<{
    locations: ILocation[];
    owner: IOwner;
  }>
> => {
  const accessToken = await getAccessToken();

  const queryParams = new URLSearchParams({
    owner_key_like,
    first_name_like,
    last_name_like,
    email_like,
    phone_like,
    cell_phone_like,
    limit: limit.toString(),
    expand: expand.toString(),
    page: page.toString(),
    size: size.toString(),
  });

  const response = await fetch(
    `/api/v0/authorized/locations/owners-search?${queryParams.toString()}`,
    fetchConfig(accessToken),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch owners: ${response.statusText}`);
  }

  return response.json();
};

export const searchOwners = (params: {
  owner_key_like?: string;
  first_name_like?: string;
  last_name_like?: string;
  email_like?: string;
  phone_like?: string;
  cell_phone_like?: string;
  limit?: number;
  expand?: boolean;
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: ["OwnersSearch", params],
    queryFn: () => fetchOwnerSearch(params),
    enabled: Object.values(params).some(
      (value) => value !== undefined && value !== "",
    ),
  });
};
