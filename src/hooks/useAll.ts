import { useContext, useState } from "react";
import {
  matchResourceFromRoute,
  pickDataProvider,
  ResourceContext,
  useDataProvider,
  useMeta,
  BaseRecord,
  MetaQuery,
} from "@refinedev/core";
import { useLocation } from "react-router";

type UseAllOptionsType<
  TData extends BaseRecord = BaseRecord,
  TVariables = any,
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
};

type UseAllReturnType<TData> = {
  isLoading: boolean;
  triggerAll: (props?: any) => Promise<any[]>;
};

export const useAll = <
  TData extends BaseRecord = BaseRecord,
  TVariables = any,
>({
  maxItemCount,
  pageSize = 500,
  resource: resourceFromProps,
  dataProviderName,
  meta,
}: UseAllOptionsType<TData, TVariables> = {}): UseAllReturnType<TData> => {
  const [isLoading, setIsLoading] = useState(false);

  const dataProvider = useDataProvider();
  const getMeta = useMeta();
  const { resources } = useContext(ResourceContext);
  const location = useLocation();
  const resource = resourceFromProps
    ? resources.find(
        (item) =>
          item.name === resourceFromProps || item.identifier === resourceFromProps,
      )
    : matchResourceFromRoute(location.pathname, resources).resource;
  const identifier = resource?.identifier ?? resource?.name;
  const { getList } = dataProvider(
    pickDataProvider(identifier, dataProviderName, resources),
  );
  const combinedMeta = getMeta({
    resource,
    meta,
  });

  const triggerAll = async (props) => {
    setIsLoading(true);

    let rawData = [];

    let current = 1;
    let preparingData = true;

    let resourceTag = resource?.name;
    if (props) {
      resourceTag = props.resource ?? resource?.name;
    }

    while (preparingData) {
      try {
        const { data, total } = await getList({
          resource: resourceTag.toString(),
          pagination: {
            currentPage: current,
            pageSize: pageSize,
          },
          meta: combinedMeta,
        });

        current++;

        rawData.push(...data);

        if (maxItemCount && rawData.length >= maxItemCount) {
          rawData = rawData.slice(0, maxItemCount);
          preparingData = false;
        }

        if (total === rawData.length || data.length < pageSize) {
          preparingData = false;
        }

        if (preparingData === false) {
          setIsLoading(false);
          return rawData;
        }
      } catch (error) {
        setIsLoading(false);
        preparingData = false;

        return;
      }
    }
  };
  return {
    isLoading,
    triggerAll,
  };
};
