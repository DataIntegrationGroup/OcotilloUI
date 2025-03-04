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
import {Card, TextField} from "@mui/material";
import Stack from "@mui/material/Stack";
import {useShow} from "@refinedev/core";
import Box from "@mui/material/Box";

import {useAll} from "@/useAll";
import {useEffect, useRef, useState} from "react";
import type {IHydrographDatasource} from "@/interfaces/st2";
import {EditableHydrograph} from "@/components/Hydrographs/EditableHydrograph";
import {transform} from "@/components/Hydrographs/util";
// import {DebouncedTextInput} from "@/components/DebouncedTextInput";


export const HydrographCorrector = () => {

    const chartRef = useRef(null)
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

    const [dtwOffset, setDTWOffset] = useState<number>(0)
    const [chartData, setChartData] = useState({series: [], dataset: [], seriesNames: []})
    const [brushSelection, setBrushSelection] = useState<{ globalMin: number, globalMax: number } | null>(null);
    const [refreshHydrograph, setRefreshHydrograph] = useState(0)

    const {isLoading, triggerAll} = useAll({
        resource: `Datastreams(${activeDatastreamId})/Observations`,
        maxItemCount: 1000,
        meta: {
            // filter: getObservationFilter(),
            orderby: 'resultTime asc'
        },
        dataProviderName: 'st2',
    });

    const {isLoading: isLoadingAMP, triggerAll: triggerAMP} = useAll({
        resource: `waterlevels/manual`,

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

    const make_series = (data: any,
                         xtag: string, ytag: string,
                         id: string, index: number = 0) => {
        let ref = data[0][ytag]

        let obj = {id: id}
        let offset = 0
        // if (index === 0) {
        //     offset = 0
        // } else {
        //     let pref = datasource[index - 1].data[0][ytag]
        //     let vs = datasource[index - 1].data.map((obs) => obs[ytag] - pref)
        //     offset = Math.max(...vs) * 1.1
        // }

        obj['source'] = data.map((obs) => [new Date(obs[xtag]),
            transform(obs[ytag], ref, index, offset, undefined).toFixed(2)])
        return obj
    }

    useEffect(() => {
        if (brushSelection && chartRef.current) {
            const instance = chartRef.current.getEchartsInstance();
            console.log('Dispatching brush action:', brushSelection);
            instance.dispatchAction({
                type: 'brush',
                areas: [{
                    brushType: 'lineX',
                    // coordRange: [brushSelection.minDataCoord, brushSelection.maxDataCoord],
                    range: [brushSelection.globalMin, brushSelection.globalMax],
                    xAxisIndex: 0
                }]
            });
        }
    }, [chartData]);

    useEffect(() => {
        triggerAll().then((data) => {
            const continuous_data = data.map((d) => {
                return {
                    phenomenonTime: d.phenomenonTime,
                    result: parseFloat(d.result),
                }
            })

            triggerAMP().then((data2) => {
                const manual_data = data2.map((d) => {
                    return {
                        phenomenonTime: d.DateMeasured,
                        result: d.DepthToWaterBGS,
                    }
                })

                const continuous_series = {
                    type: 'line',
                    symbol: 'circle',
                    name: 'Continuous',
                    datasetId: 'continuous',
                    clip: false
                }

                const manual_series = {
                    type: 'scatter',
                    symbol: 'circle',
                    name: 'Manual',
                    datasetId: 'manual',
                    clip: false
                }
                const series = [continuous_series, manual_series]
                const dataset = [make_series(continuous_data, 'phenomenonTime', 'result', 'continuous'),
                    // make_series(manual_data, 'phenomenonTime', 'result', 'manual')
                ]
                const seriesNames = ['Continuous', 'Manual']
                setChartData({
                    series: series,
                    dataset: dataset,
                    seriesNames: seriesNames
                })

                // setRefreshHydrograph((prev) => prev + 1)
            })
        })


    }, [activeDatastreamId]);

    const onBrushEnd = (params: any) => {
        console.log('brush end', params);
        console.log('dtwOffset', dtwOffset, typeof dtwOffset);
        const area = params.areas[0];
        const [mi, ma] = area.range;

        if (chartRef.current) {
            const instance = chartRef.current.getEchartsInstance();
            const minDataCoord = instance.convertFromPixel('grid', [mi, 0])[0];
            const maxDataCoord = instance.convertFromPixel('grid', [ma, 0])[0];

            setChartData((prev) => {
                const newDataset = [{
                    'id': 'continuous',
                    'source': prev.dataset[0].source.map((d) => {
                        const tindex = d[0].getTime();
                        if (tindex >= minDataCoord && tindex <= maxDataCoord) {
                            d[1] = parseFloat(d[1]) + dtwOffset;
                        }
                        return d;
                    })
                }];
                return {...prev, dataset: newDataset};
            });

            // Store the brush selection state
            setBrushSelection({globalMin: mi, globalMax: ma});
        }
    };

    return (
        <Box>
            <Typography variant={'h3'}>Hydrograph Corrector</Typography>
            {/*<DebouncedTextInput value={dtwOffset} setValue={setDTWOffset}/>*/}
            <TextField value={dtwOffset}
                       onChange={(e) => setDTWOffset(parseFloat(e.target.value))}/>
            <EditableHydrograph
                chartRef={chartRef}
                onEvents={{brushEnd: onBrushEnd}}
                chartData={chartData} refresh={refreshHydrograph}/>
        </Box>
    )
}
// ============= EOF =============================================