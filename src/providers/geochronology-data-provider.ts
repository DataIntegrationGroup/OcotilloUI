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
const API_URL = "http://localhost:8000";


export const fetcher = async (url: string, options?: RequestInit) => {

    // const auth = sessionStorage.getItem("fief-authstate");
    // const token = auth ? JSON.parse(auth).tokenInfo.access_token : "";
    // const token = getAccessToken();

    return fetch(`${API_URL}/${url}`, {
        ...options,
        headers: {
            ...options?.headers,
            // Authorization: `Bearer ${token}`,
        },
    });
}

export const geochronologyDataProvider: DataProvider = {
    getList: async ({resource, pagination, filters, sorters, meta}) => {
        const params = new URLSearchParams();

        if (pagination) {
            if (meta?.pagination) {
                params.append("page", meta.pagination.current.toString());
                params.append("size", meta.pagination.pageSize.toString());
            } else {
                params.append("page", pagination.current.toString());
                params.append("size", pagination.pageSize.toString());
            }
        }

        if (sorters && sorters.length > 0) {
            params.append("sort", sorters.map((sorter) => sorter.field).join(","));
            params.append("order", sorters.map((sorter) => sorter.order).join(","));
        }
        let convert_title = false
        if (['principal_investigators', 'projects', 'materials'].includes(resource)) {
            convert_title = true
        }
        if (filters && filters.length > 0) {
            filters.forEach((filter) => {
                if (filter['field'] == 'title' && convert_title) {
                    if (resource=='principal_investigators') {
                        filter['field'] = 'last_name'
                    }
                    if (resource=='projects') {
                        filter['field'] = 'name'
                    }
                    if (resource=='materials') {
                        filter['field'] = 'name'
                    }
                }

                params.append('filter', JSON.stringify(filter));
            });
        }


        const response = await fetcher(`${resource}?${params.toString()}`);
        if (response.status < 200 || response.status > 299) throw response;
        const resp = await response.json();

        let data;
        let total;
        if (['projects', 'samples', 'materials', 'principal_investigators'].includes(resource)) {
            data = resp.items;
            total = resp.total;
        } else {
            data = resp;
            total = data.length;
        }

        console.log('getList', resp);
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