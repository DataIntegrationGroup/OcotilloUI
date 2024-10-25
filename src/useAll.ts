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

import {useState} from "react";
import {pickDataProvider, pickNotDeprecated, useDataProvider, useMeta, useResource} from "@refinedev/core";

// @ts-ignore,
import type {BaseRecord, MetaQuery} from "@refinedev/core/src/contexts/data/types";

type UseAllOptionsType<
    TData extends BaseRecord = BaseRecord,
    TVariables = any
> = {
    /**
     * Resource name for API data interactions
     * @default Resource name that it reads from route
     */
    resource?: string;
    /**
     * Maximum number of items to fetch
     */
    maxItemCount?: number;
    /**
     * Number of items to fetch per page
     */
    pageSize?: number;
    /**
     * Data provider name to use for fetching data
     */
    dataProviderName?: string;
    meta?: MetaQuery;
}

type UseAllReturnType<TData> = {
    isLoading: boolean;
    triggerAll: () => Promise<any[]>;
}

export const useAll = <
    TData extends BaseRecord = BaseRecord,
    TVariables = any,
>({
      maxItemCount,
      pageSize = 500,
      resource: resourceFromProps,
      dataProviderName,
      meta
  }: UseAllOptionsType<TData, TVariables> = {}): UseAllReturnType<TData> => {
    const [isLoading, setIsLoading] = useState(false);

    const dataProvider = useDataProvider();
    const getMeta = useMeta();
    const {resource, resources, identifier} = useResource(resourceFromProps);
    const {getList} = dataProvider(
        pickDataProvider(identifier, dataProviderName, resources),
    );
    const combinedMeta = getMeta({
        resource,
        meta
    });

    const triggerAll = async () => {
        setIsLoading(true)
        console.log('trigger allgasdf')

        let rawData = [];

        let current = 1;
        let preparingData = true;
        while (preparingData) {
            try {
                const {data, total} = await getList({
                    resource: resource?.name ?? "",
                    // filters,
                    // sort: pickNotDeprecated(sorters, sorter),
                    // sorters: pickNotDeprecated(sorters, sorter),
                    pagination: {
                        current,
                        pageSize: pageSize,
                    },
                    meta: combinedMeta,
                    // metaData: combinedMeta,
                });

                current++;

                rawData.push(...data);

                if (maxItemCount && rawData.length >= maxItemCount) {
                    rawData = rawData.slice(0, maxItemCount);
                    preparingData = false;
                }

                if (total === rawData.length) {
                    preparingData = false;
                }

                if (preparingData === false) {
                    // setData(rawData);
                    setIsLoading(false);
                    return rawData;
                }


            } catch (error) {
                setIsLoading(false);
                preparingData = false;
                console.log('error', error)
                // onError?.(error);

                return;
            }
        }
    }
    return {
        isLoading,
        triggerAll,
    }
}
// ============= EOF =============================================