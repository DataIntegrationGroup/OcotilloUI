import type { DataProvider } from "@refinedev/core";
import { settings } from "@/settings";

export const fetcher = async (url: string, options?: RequestInit) => {
  return fetch(`${settings.nmbgmr_geothermal_api_url}/${url}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });
};

export const geothermalDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const params = new URLSearchParams();

    if (pagination) {
      if (meta?.pagination) {
        params.append("page", (meta.pagination.currentPage ?? 1).toString());
        params.append("size", meta.pagination.pageSize.toString());
      } else {
        params.append("page", (pagination.currentPage ?? 1).toString());
        params.append("size", pagination.pageSize.toString());
      }
    }

    if (sorters && sorters.length > 0) {
      params.append("sort", sorters.map((sorter) => sorter.field).join(","));
      params.append("order", sorters.map((sorter) => sorter.order).join(","));
    }
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        params.append("filter", JSON.stringify(filter));
      });
    }

    const response = await fetcher(`${resource}?${params.toString()}`);
    if (response.status < 200 || response.status > 299) throw response;
    const resp = await response.json();

    const data = resp;
    const total = data.length;

    return {
      data,
      total,
    };
  },
  getMany: async ({ resource, ids, meta }) => {
    const params = new URLSearchParams();

    if (ids) {
      ids.forEach((id) => params.append("id", id.toString()));
    }

    const response = await fetcher(`${resource}?${params.toString()}`);

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },
  getOne: async ({ resource, id, meta }) => {
    const response = await fetcher(`${resource}/${id}`);

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();
    return { data };
  },
  create: async ({ resource, variables }) => {
    const response = await fetcher(`${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },
  update: async ({ resource, id, variables }) => {
    const response = await fetcher(`${resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(variables),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },
  getApiUrl: () => settings.nmbgmr_geothermal_api_url,
  deleteOne: () => {
    throw new Error("Not implemented");
  },
};
