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

import React, {useEffect, useRef} from 'react';
import ReactECharts from 'echarts-for-react'
import type {IHydrographDatasource, IHydrographOptions} from "@/interfaces/st2";


export const ST2Hydrograph: React.FC<{
    datasource: IHydrographDatasource[],
    refresh: number,
    options?: IHydrographOptions
}> = ({datasource, refresh, options}) => {

    return (
        <Hydrograph datasource={datasource} refresh={refresh} options={options}/>
    )
}

const transform = (v: number,
                   ref: number,
                   index: number,
                   offset: number,
                   options: IHydrographOptions) => {
    if (options.useNormalization) {
        return (v - ref)
    } else if (options.useElevation) {
        // return (v - datasource[0].data[0][ytag]).toFixed(2)
    } else if (options.useCompact) {
        return (v - ref + offset)
    } else {
        return v
    }
}

export const Hydrograph: React.FC<{
    datasource: IHydrographDatasource[],
    refresh: number,
    options?: IHydrographOptions
}> = ({datasource, refresh, options}) => {

    const series = datasource.map((s) => {
        return {
            type: 'line',
            symbol: 'circle',
            name: s.name,
            datasetId: s.id.toString(),
            clip: false
        }
    })

    const xtag = 'phenomenonTime'
    const ytag = 'result'

    const dataset = datasource.map((s, index) => {
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

    let yaxisTitle = 'Depth To Water Below Ground Surface (ft)'

    if (options.useNormalization) {
        yaxisTitle = 'Normalized Depth To Water Below Ground Surface (ft)'
    } else if (options.useElevation) {
        yaxisTitle = 'Groundwater Elevation Above Sea Level (ft)'
    } else if (options.useCompact) {
        yaxisTitle = 'Compact Depth To Water Below Ground Surface (ft)'
    }

    let dataZoomStart = -1
    let dataZoomEnd = 100
    if (options.dataZoom == 'latest') {
        dataZoomStart = 80
        dataZoomEnd = 100
    } else if (options.dataZoom == 'earliest') {
        dataZoomStart = 0
        dataZoomEnd = 20
    }

    const seriesNames = datasource.map((d) => d.name)

    const option = {
        animation: false,
        dataset: dataset,
        series: series,
        toolbox: {
            feature: {
                dataZoom: [
                    {show: true, title: {zoom: 'Zoom In', back: 'Zoom Out'}},
                    {type: 'inside', title: {zoom: 'Zoom In', back: 'Zoom Out'}}
                ],
                restore: {},
                saveAsImage: {},
                dataView: {show: true}
            }
        },
        legend: {
            orient: 'vertical',
            left: '82%',
            top: '20%',
            data: seriesNames,
        },
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
    }

    return (
        <div style={{
            height: '400px',
            paddingBottom: 20
        }}>
            <ReactECharts
                key={refresh}
                option={option}
                style={{width: '100%', height: '100%'}}
            />
        </div>
    )
}
// ============= EOF =============================================