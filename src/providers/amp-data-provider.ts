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

// const API_URL = "https://waterdata.nmt.edu/authorized";
const API_URL = `${settings.nmbgmr_amp_api_url}/latest`;

import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import createAuthRefreshInterceptor from 'axios-auth-refresh';

export const axiosInstance: AxiosInstance = axios.create();

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

const refreshAuthLogic = async (failedRequest) => {
    const token = getAccessToken(true);
    failedRequest.response.config.headers['Authorization'] = 'Bearer ' + token;
    return Promise.resolve();
};

createAuthRefreshInterceptor(axiosInstance, refreshAuthLogic);

export const fetcher = async (url: string, config?: AxiosRequestConfig) => {
    config = config || {};
    config['method'] = 'GET';
    return axiosCall(url, config);
}

export const axiosCall = async (url: string, options: AxiosRequestConfig) => {
    const config = {url: `${API_URL}/${url}`, ...options};
    return axiosInstance(config);
}


const getPhotos = async (id) => {
    const response = await fetcher(`wells/photos?pointid=${id}`);
    console.log('getPhotos', response);
    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.data;

    console.log('asdfasdf', data)
    let photos = await Promise.all(
        data.map(async (photo) => {
            try {
                const resp = await fetcher(
                    `wells/photo/${photo.OLEPath}`);
                console.log('getPhoto', resp);

                return {
                    key: photo.OLEPath,
                    src: URL.createObjectURL(await resp.data),
                    caption: photo.OLEPath,
                };
            } catch (e) {
                console.log("getPhoto error:", e);
                return {
                    key: photo.OLEPath,
                    src: '',
                    caption: photo.OLEPath,
                };
            }
        }),
    );

    return {data: photos};
}


export const ampDataProvider: DataProvider = {
    getList: async ({resource, pagination, filters, sorters, meta}) => {
        const params = new URLSearchParams();

        if (meta?.params !== undefined) {
            Object.entries(meta['params']).forEach(([key, value]) => {
                if (value === null || value === undefined) return;
                params.append(key, String(value));
            });
        }

        if (pagination) {
            params.append("page", pagination.current.toString());
            params.append("size", pagination.pageSize.toString());
        }

        if (sorters && sorters.length > 0) {
            params.append("sort", sorters.map((sorter) => sorter.field).join(","));
            params.append("order", sorters.map((sorter) => sorter.order).join(","));
        }

        if (filters && filters.length > 0) {
            filters.forEach((filter) => {
                params.append('filter', JSON.stringify(filter));
            });
        }

        let url: string;
        if (['formations', 'level_status',
            'measurement_method', 'data_quality',
            'measuring_agency', 'data_source'].includes(resource)) {
            url = `authorized/lookuptable/${resource}`;
        } else if (['waterlevels/manual'].includes(resource)) {
            url = `${resource}`;
        } else {
            url = `authorized/tabular/${resource}`;
        }

        console.log('getlist', resource, url, params.toString());
        const response = await fetcher(`${url}?${params.toString()}`);

        if (response.status < 200 || response.status > 299) throw response;

        let data;
        let total;
        // if (['wells', 'locations', 'equipment',
        //     'manual_waterlevels', 'projects'].includes(resource)) {
        //     data = response.data.items;
        //     total = response.data.total;
        // } else {
        //     data = response.data;
        //     total = data.length;
        // }
        if ("items" in response.data) {
            data = response.data.items;
            total = response.data.total;
        } else {
            data = response.data;
            total = data.length
        }

        console.log('getList', resource, total, data);

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

        return await response.data;
    },
    getOne: async ({resource, id, meta}) => {
        if (resource == 'photos') {
            console.log('asdfasdffgetasdfsdf', id)
            return await getPhotos(id)
        }

        let url;
        if (resource == 'dashboard') {
            url = `authorized/tabular/dashboard`;
        } else {
            url = `authorized/tabular/${resource}/${id}`;
        }

        console.log('getOne', url, resource, id, meta);
        const response = await fetcher(url);

        if (response.status < 200 || response.status > 299) throw response;

        const data = await response.data;
        console.log('getOne data', data);
        return {data};
    },
    create: async ({resource, variables}) => {
        const response = await axiosCall(`${resource}`, {
            method: "POST",
            data: JSON.stringify(variables),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status < 200 || response.status > 299) throw response;

        const data = await response.data;

        return {data};
    },
    update: async ({resource, id, variables}) => {
        const response = await axiosCall(`${resource}/${id}`, {
            method: "PATCH",
            data: JSON.stringify(variables),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status < 200 || response.status > 299) throw response;

        const data = await response.data;

        return {data};
    },
    getApiUrl: () => API_URL,
    deleteOne: () => {
        throw new Error("Not implemented");
    },
    /* ... */
};

// ============= EOF =============================================