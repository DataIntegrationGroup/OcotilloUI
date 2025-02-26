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

import Typography from "@mui/material/Typography";
import {Card} from "@mui/material";
import Stack from "@mui/material/Stack";
import {useShow} from "@refinedev/core";
import Box from "@mui/material/Box";
import {ST2Hydrograph} from "@/components/Hydrograph";
import {useAll} from "@/useAll";
import {useEffect, useState} from "react";
import type {IHydrographDatasource} from "@/interfaces/st2";


export const HydrographCorrector = () => {

    // const {query} = useShow({
    //     resource: 'hydrograph_corrector',
    //     id: 'hydrograph_corrector',
    //     dataProviderName: 'amp'
    // });
    //
    // const stats = query.data?.data
    // console.log(query.data?.data)
    // const [data, setData] = useState({id: 0, name: '', data: []})

    // hardcoded stuff. in future will be combination of user defined and retrieved data
    const activeDatastreamId = 26188
    const pointid = 'SO-0167'


    const [data, setData] = useState<IHydrographDatasource[]>([])
    const [refreshHydrograph, setRefreshHydrograph] = useState(0)

    // const getObservationFilter = () => {
    //     let fs = []
    //     if (minDate) {
    //         fs.push(`phenomenonTime gt ${minDate.toISOString()}`)
    //     }
    //     if (maxDate) {
    //         fs.push(`phenomenonTime lt ${maxDate.toISOString()}`)
    //     }
    //     return fs.join(' and ')
    // }

    const {isLoading, triggerAll} = useAll({
        resource: `Datastreams(${activeDatastreamId})/Observations`,
        maxItemCount: 100,
        meta: {
            // filter: getObservationFilter(),
            orderby: 'resultTime asc'
        },
        dataProviderName: 'st2',
    });

    const {isLoading: isLoadingAMP, triggerAll: triggerAMP} = useAll({
        resource: `waterlevels/manual`,
        maxItemCount: 100,
        // meta: {
        //     // filter: getObservationFilter(),
        //     orderby: 'resultTime asc'
        // },
        meta: {
            params: {
                pointid: pointid
            }
        },
        dataProviderName: 'amp',
    });

    useEffect(() => {
        triggerAll().then((data) => {
            triggerAMP().then((manual_data) => {

                const md = manual_data.map((d) => {
                    return {
                        phenomenonTime: d.DateMeasured,
                        result: d.DepthToWaterBGS
                    }
                })

                setData([{id: activeDatastreamId, name: 'foo', data: data},
                    {id: 0, name: 'manual', data: md}])
                setRefreshHydrograph((prev) => prev + 1)
            })
        })


    }, [activeDatastreamId]);

    return (
        <Box>
            <Typography variant={'h3'}>Hydrograph Corrector</Typography>
            <ST2Hydrograph datasource={data} refresh={refreshHydrograph}/>
        </Box>
    )
}
// ============= EOF =============================================