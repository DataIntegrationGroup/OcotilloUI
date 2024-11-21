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
import {settings} from "@/settings";


export const fetcher = async (url: string, options?: RequestInit) => {
    return fetch(`${settings.st2_url}/${url}`, {
        ...options,
    });
}

export const st2DataProvider: DataProvider = {
    getList: async ({resource, pagination, filters, sorters, meta}) => {
        const params = new URLSearchParams();
        params.append("$count", "true")
        console.log('masdf', meta?.filter)
        if (meta) {
            if (meta.expand) {
                params.append("$expand", meta.expand);
            }
            if (meta.filter) {
                params.append("$filter", meta.filter);
            }
            if (meta.orderby){
                params.append("$orderby", meta.orderby);
            }
            if (meta.id){
                resource = `${resource}(${meta.id})`
            }
        }
        if (pagination) {

            const pag = meta?.pagination || pagination
            params.append("$top", pag.pageSize.toString())
            params.append("$skip", (pag.pageSize * (pag.current - 1)).toString())

        }

        // if (sorters && sorters.length > 0) {
        //     params.append("sort", sorters.map((sorter) => sorter.field).join(","));
        //     params.append("order", sorters.map((sorter) => sorter.order).join(","));
        // }
        //
        //
        // if (filters && filters.length > 0) {
        //     filters.forEach((filter) => {
        //         params.append('filter', JSON.stringify(filter));
        //     });
        // }

        const response = await fetcher(`${resource}?${params.toString()}`);
        console.log(response.url)
        if (response.status < 200 || response.status > 299) throw response;
        const resp = await response.json();

        let data = resp.value;
        let total = resp["@iot.count"];

        // console.log('getList', resp);
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
    getApiUrl: () => settings.st2_url,
    deleteOne: () => {
        throw new Error("Not implemented");
    },
    /* ... */
};

// ============= EOF =============================================