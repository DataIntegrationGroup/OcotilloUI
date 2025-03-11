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

import React, {useEffect, useRef, useState} from 'react';
import ReactECharts from 'echarts-for-react'
import type {IHydrographDatasource, IHydrographOptions} from "@/interfaces/st2";
import {transform} from "@/components/Hydrographs/util";


export const ST2Hydrograph: React.FC<{
    datasource: IHydrographDatasource[],
    refresh: number,
    options?: IHydrographOptions
}> = ({datasource, refresh, options}) => {

    return (
        <Hydrograph datasource={datasource} refresh={refresh} options={options}/>
    )
}


export const Hydrograph: React.FC<{
    datasource: IHydrographDatasource[],
    refresh?: number,
    options?: IHydrographOptions,
    onEvents?: any,
}> = ({datasource, refresh, options, onEvents}) => {
    const xtag = 'phenomenonTime'
    const ytag = 'result'

    let series = []
    let dataset = []
    let seriesNames = []
    const [chartData, setChartData] = useState({series, dataset, seriesNames})

    useEffect(() => {
        console.log('datasource', datasource)
        if (datasource && datasource.length > 0) {
            series = datasource.map((s) => {
                return {
                    type: s.style || 'line',
                    symbol: 'circle',
                    name: s.name,
                    datasetId: s.id.toString(),
                    clip: false
                }
            })
            dataset = datasource.map((s, index) => {
                let ref = s.data[0][ytag]

                let obj = {id: s.id.toString()}
                let offset = 0
                if (index === 0) {
                    offset = 0
                } else {
                    let pref = datasource[index - 1].data[0][ytag]
                    let vs = datasource[index - 1].data.map((obs) => obs[ytag] - pref)
                    offset = Math.max(...vs) * 1.1
                }

                obj['source'] = s.data.map((obs) => [new Date(obs[xtag]),
                    transform(obs[ytag], ref, index, offset, options).toFixed(2)])
                return obj
            })

            seriesNames = datasource.map((d) => d.name)

            // setChartData({series, dataset, seriesNames})
            setOption((prev) => {
                return {...prev, series, dataset}
            })
        }
    }, [datasource]);

    let yaxisTitle = 'Depth To Water Below Ground Surface (ft)'

    if (options?.useNormalization) {
        yaxisTitle = 'Normalized Depth To Water Below Ground Surface (ft)'
    } else if (options?.useElevation) {
        yaxisTitle = 'Groundwater Elevation Above Sea Level (ft)'
    } else if (options?.useCompact) {
        yaxisTitle = 'Compact Depth To Water Below Ground Surface (ft)'
    }

    let dataZoomStart = -1
    let dataZoomEnd = 100
    if (options?.dataZoom == 'latest') {
        dataZoomStart = 80
        dataZoomEnd = 100
    } else if (options?.dataZoom == 'earliest') {
        dataZoomStart = 0
        dataZoomEnd = 20
    }


    const baseoption = {
        animation: false,
        dataset: chartData.dataset,
        series: chartData.series,
        toolbox: {
            feature: {
                dataZoom: [
                    {show: true, title: {zoom: 'Zoom In', back: 'Zoom Out'}},
                    {type: 'inside', title: {zoom: 'Zoom In', back: 'Zoom Out'}}
                ],
                restore: {},
                saveAsImage: {},
                dataView: {show: true},
                brush: {
                    type: ['lineX', 'clear']
                }
            }
        },
        // legend: {
        //     orient: 'vertical',
        //     left: '82%',
        //     top: '20%',
        //     data: chartData.seriesNames,
        // },
        grid: {
            right: '20%' // Adjust the right property to create space for the legend
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                animation: false,
                label: {
                    backgroundColor: '#505765'
                }
            }
        },
        dataZoom: [
            {
                show: true,
                realtime: true,
                start: dataZoomStart,
                end: dataZoomEnd
            },
            {
                type: 'inside',
                realtime: true,
                start: dataZoomStart,
                end: dataZoomEnd
            }
        ],
        xAxis: {
            type: 'time',
            splitLine: {
                show: true // This will display vertical grid lines
            }
        },
        yAxis: {
            inverse: true,
            name: yaxisTitle,
            nameLocation: 'center',
            nameGap: 75,
            scale: true
        },
        brush: {
            // xAxisIndex: 'all',
            // brushLink: 'all',
            outOfBrush: {
                colorAlpha: 0.25
            }
        },
    }

    const [option, setOption] = useState(baseoption)

    // const onSelection = (params) => {
    //     console.log('Chart clicked', params.batch[0].selected);
    // };

    // const onEnd = (params) => {
    //     console.log('on end', params);
    //     const area = params.areas[0]
    //     console.log(area)
    //     console.log(area.range)
    //
    //     const [mi, ma] = area.range
    //
    //     setOption((prev) => {
    //         const newdata = prev.dataset[0].source.map((d) => {
    //             console.log('d', d, d[1] + 5)
    //             return [d[0], parseFloat(d[1]) + 5]
    //         })
    //
    //         console.log('newdata', newdata)
    //         return {...prev, dataset: [{...prev.dataset[0], source: newdata}, ...prev.dataset.slice(1),]}
    //     })
    //     // setChartData((prev) => {
    //     //     console.log('prev', prev)
    //     //
    //     //     const newdata = prev.dataset[0].source.map((d) => {
    //     //         console.log('d', d, d[1] + 5)
    //     //         return [d[0], parseFloat(d[1]) + 5]
    //     //     })
    //     //
    //     //     console.log('newdata', newdata)
    //     //     prev.dataset = [
    //     //         {...prev.dataset[0], source: newdata}, ...prev.dataset.slice(1),
    //     //     ]
    //     //     return prev
    //     // })
    //     // grab the selected range
    //     // let selected = params.batch[0
    //
    //
    // };

    // const onEvents = {
    //     brushSelected: onSelection,
    //     brushEnd: onSelectionEnd
    // };

    return (
        <div style={{
            height: '400px',
            paddingBottom: 20
        }}>
            <ReactECharts
                key={refresh}
                option={option}
                style={{width: '100%', height: '100%'}}
                onEvents={onEvents}
                onChartReady={(echarts) => {
                    console.log('chart ready', echarts)
                    // echarts.on('click', (params) => {
                    //     console.log('click', params)
                    // })
                }}
            />
        </div>
    )
}
// ============= EOF =============================================