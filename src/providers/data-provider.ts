// ===============================================================================
// Copyright 2024 Jake Ross
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================


import type {DataProvider} from "@refinedev/core";
import {getAccessToken} from "./fief-provider";

// const API_URL = "https://waterdata.nmt.edu/authorized";
const API_URL = "http://localhost:8009/authorized";


const fetcher = async (url: string, options?: RequestInit) => {

    // const auth = sessionStorage.getItem("fief-authstate");
    // const token = auth ? JSON.parse(auth).tokenInfo.access_token : "";
    const token = getAccessToken();

    return fetch(`${API_URL}/${url}`, {
        ...options,
        headers: {
            ...options?.headers,
            Authorization: `Bearer ${token}`,
        },
    });
}

export const dataProvider: DataProvider = {
    getList: async ({resource, pagination, filters, sorters, meta}) => {
        const params = new URLSearchParams();

        if (pagination) {
            params.append("page", pagination.current.toString());
            params.append("size", pagination.pageSize.toString());
        }

        if (sorters && sorters.length > 0) {
            params.append("_sort", sorters.map((sorter) => sorter.field).join(","));
            params.append("_order", sorters.map((sorter) => sorter.order).join(","));
        }

        if (filters && filters.length > 0) {
            filters.forEach((filter) => {
                if ("field" in filter && filter.operator === "eq") {
                    // Our fake API supports "eq" operator by simply appending the field name and value to the query string.
                    params.append(filter.field, filter.value);
                }
            });
        }

        let url;
        console.log('getList', resource);
        if (['formations', 'level_status',
            'measurement_method', 'data_quality',
            'measuring_agency', 'data_source'].includes(resource)) {
            url = `lookuptable/${resource}`;
        } else {
            url = `tabular/${resource}`;
        }

        const response = await fetcher(`${url}?${params.toString()}`);

        if (response.status < 200 || response.status > 299) throw response;

        const resp = await response.json();
        let data;
        let total;
        if (['wells', 'locations', 'equipment'].includes(resource)) {
            data = resp.items;
            total = resp.total;
        } else {
            data = resp;
            total = data.length;
        }

        return {
            data,
            total,
        };
    },
    getMany: async ({resource, ids, meta}) => {
        const params = new URLSearchParams();

        if (ids) {
            ids.forEach((id) => params.append("id", id.toString()));
        }

        const response = await fetcher(
            `${resource}?${params.toString()}`,
        );

        if (response.status < 200 || response.status > 299) throw response;

        const data = await response.json();

        return {data};
    },
    getOne: async ({resource, id, meta}) => {
        const response = await fetcher(`${resource}/${id}`);

        if (response.status < 200 || response.status > 299) throw response;

        const data = await response.json();
        console.log('getOne', data);
        return {data};
    },
    create: async ({resource, variables}) => {
        const response = await fetcher(`${resource}`, {
            method: "POST",
            body: JSON.stringify(variables),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status < 200 || response.status > 299) throw response;

        const data = await response.json();

        return {data};
    },
    update: async ({resource, id, variables}) => {
        const response = await fetcher(`${resource}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(variables),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status < 200 || response.status > 299) throw response;

        const data = await response.json();

        return {data};
    },
    getApiUrl: () => API_URL,
    deleteOne: () => {
        throw new Error("Not implemented");
    },
    /* ... */
};

// ============= EOF =============================================