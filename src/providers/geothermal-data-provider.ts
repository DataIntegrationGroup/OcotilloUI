import type { DataProvider } from "@refinedev/core";
import { settings } from "@/settings";
import { getAccessToken } from "@/providers/authentik-provider";

export const fetcher = async (url: string, options?: RequestInit) => {
  const doFetch = (token?: string | null) =>
    fetch(`${settings.nmbgmr_geothermal_api_url}/${url}`, {
      ...options,
      headers: {
        ...options?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response = await doFetch(await getAccessToken());

  // On 401, refresh the token once and retry (mirrors the ocotillo provider).
  if (response.status === 401) {
    const token = await getAccessToken({ refresh: true });
    if (token) response = await doFetch(token);
  }

  return response;
};

/**
 * Map a FastAPI/Pydantic validation payload (`{ detail: [{ loc, msg }] }`) to
 * Refine's `fieldErrors` shape (`{ field: [msg] }`). Mirrors the ocotillo
 * provider so failed cells can surface inline. Strips the leading `body.`
 * segment Pydantic prepends to request-body fields.
 */
const buildFieldErrors = (
  detail: Array<{ loc?: (string | number)[]; msg?: string }>,
): Record<string, string[]> => {
  const refined: Record<string, string[]> = {};
  detail.forEach((issue) => {
    const path = (issue.loc ?? []).join(".");
    const field = path.startsWith("body.") ? path.substring(5) : path;
    if (!field) return;
    (refined[field] ??= []).push(issue.msg ?? "Invalid value");
  });
  return refined;
};

/**
 * Throw on a non-2xx write response. For 422/409 with a Pydantic `detail`
 * array, throw a transformed Error carrying `fieldErrors`/`errors` so callers
 * can attach messages to specific cells; otherwise throw the raw Response.
 */
const throwOnWriteError = async (response: Response): Promise<void> => {
  if (response.status >= 200 && response.status <= 299) return;

  if (response.status === 422 || response.status === 409) {
    let body: { detail?: unknown } | undefined;
    try {
      body = await response.json();
    } catch {
      throw response;
    }
    if (body?.detail && Array.isArray(body.detail)) {
      const fieldErrors = buildFieldErrors(body.detail);
      const error = new Error("Validation Error") as Error & {
        status?: number;
        errors?: Record<string, string[]>;
        fieldErrors?: Record<string, string[]>;
      };
      error.status = response.status;
      error.errors = fieldErrors;
      error.fieldErrors = fieldErrors;
      throw error;
    }
  }

  throw response;
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
        params.append("size", (pagination.pageSize ?? 10).toString());
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

    // The API may return either a paginated envelope
    // ({ items, total, ... }) or a bare array (older geothermal endpoints).
    let data;
    let total;
    if (resp && Array.isArray(resp.items)) {
      data = resp.items;
      total = typeof resp.total === "number" ? resp.total : resp.items.length;
    } else if (Array.isArray(resp)) {
      data = resp;
      total = resp.length;
    } else {
      data = [];
      total = 0;
    }

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

    await throwOnWriteError(response);

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

    await throwOnWriteError(response);

    const data = await response.json();

    return { data };
  },
  getApiUrl: () => settings.nmbgmr_geothermal_api_url,
  deleteOne: () => {
    throw new Error("Not implemented");
  },
};
