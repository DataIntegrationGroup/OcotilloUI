import type { DataProvider } from "@refinedev/core";
import { settings } from "@/settings";

export const fetcher = async (url: string, options?: RequestInit) => {
  return fetch(`${settings.st2_url}/${url}`, {
    ...options,
  });
};

export const st2DataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const params = new URLSearchParams();
    params.append("$count", "true");

    if (meta) {
      for (const obj of ["expand", "filter", "orderby"]) {
        if (meta[obj]) {
          params.append(`$${obj}`, meta[obj]);
        }
      }

      if (meta.id) {
        resource = `${resource}(${meta.id})`;
      }
    }
    if (pagination) {
      const pag = meta?.pagination || pagination;
      params.append("$top", pag.pageSize.toString());
      params.append("$skip", (pag.pageSize * (pag.current - 1)).toString());
    }

    const response = await fetcher(`${resource}?${params.toString()}`);
    console.log(response.url);
    if (response.status < 200 || response.status > 299) throw response;
    const resp = await response.json();

    const data = resp.value;
    const total = resp["@iot.count"];

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
    console.log("getOne", data);
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
  getApiUrl: () => settings.st2_url,
  deleteOne: () => {
    throw new Error("Not implemented");
  },
};
