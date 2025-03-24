import {getAccessToken} from "@/providers/fief-provider";
import {fetchConfig, lookupTableQueryConfig} from "./well_inventory.configs";
import {useQuery} from "@tanstack/react-query";
import {ILocation, IOwner, IWellInventoryForm, Page} from "@/interfaces";
import {settings} from "@/settings";

const ampApiFetch = async (endpoint: string,
                           failure_message: string,
                           method: string = 'GET',
                           formData?: FormData,
                           version: string = 'v0',
): Promise<any> => {

    const accessToken = await getAccessToken();
    const response = await fetch(
        `${settings.nmbgmr_api_url}/${version}/${endpoint}`,
        fetchConfig(accessToken, method, formData),
    );
    if (!response.ok) {
        throw new Error(`${failure_message}: ${response.statusText}`);
    }

    return response.json();
}

const fetchLookupTable = async (table: string): Promise<any> => {
    return await ampApiFetch(`authorized/lookuptable/${table}`,
        `Failed to fetch ${table} options`);
}

const fetchProjects = async (): Promise<
    {
        Project: string;
        PointIDPrefix: string[];
    }[]
> => {
    return await fetchLookupTable('project');

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
    return await fetchLookupTable('monitoring_status');
};

export const getMonitoringStatuses = () => {
    return useQuery({
        queryKey: ["MonitoringStatuses"],
        queryFn: fetchMonitoringStatuses,
        ...lookupTableQueryConfig,
    });
};

const fetchCoordinateDatums = async (): Promise<{ DATUMCODE: string }[]> => {
    return await fetchLookupTable('coordinate_datum');
};

export const getCoordinateDatums = () => {
    return useQuery({
        queryKey: ["CoordinateDatums"],
        queryFn: fetchCoordinateDatums,
        ...lookupTableQueryConfig,
    });
};

const fetchAltitudeDatums = async (): Promise<{ Code: string }[]> => {
    return await fetchLookupTable('altitude_datum');
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
    return await fetchLookupTable('altitude_method');
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
    return await fetchLookupTable('formation');
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
    return await fetchLookupTable('site_type');
};

export const getSiteTypes = () => {
    return useQuery({
        queryKey: ["SiteTypes"],
        queryFn: fetchSiteTypes,
        ...lookupTableQueryConfig,
    });
};

const fetchNewPointIDPreview = async (prefix: string) => {
    return await ampApiFetch(`authorized/well_inventory/newly_generated_pointid?pointid_prefix=${encodeURIComponent(prefix)}`,
        'Failed to fetch new Point ID preview');

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
    const formData = new FormData();
    const sanitizedBody = removeEmptyFields(body);
    formData.append("data", JSON.stringify(sanitizedBody));

    return await ampApiFetch('authorized/well_inventory',
        'Failed to create new well inventory entry',
        'POST',
        formData);

};

export const fetchOwnerSearch = async ({
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

    return await ampApiFetch(`authorized/locations/owners-search?${queryParams.toString()}`,
        'Failed to fetch owners');
};

const removeEmptyFields = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(removeEmptyFields);
    } else if (typeof obj === "object" && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([, value]) => value !== "")
                .map(([key, value]) => [key, removeEmptyFields(value)]),
        );
    }
    return obj;
};
