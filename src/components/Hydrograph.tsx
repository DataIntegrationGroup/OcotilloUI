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

import React, { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react'
import type {IObservation} from "@/interfaces/st2";
import {IHydrographObservation} from "@/interfaces";

export const ST2Hydrograph: React.FC<{ name: string, observations: IObservation[] }> = ({ name, observations }) => {
    // if (observations.length === 0) {
    //     observations = [{phenomenonTime: new Date().toString(), result: 0, "@iot.id": null}]
    // }
    //
    // const hobs = observations.map((obs)=>{
    //     return {dateTime: obs['phenomenonTime'], result: obs['result']}
    // })

    console.log('obbs', observations)
    return (
        <Hydrograph name={name} datasource={observations}/>
    )
}

export const Hydrograph: React.FC<{ name: string, datasource: any }> = ({ name, datasource }) => {

    const series = datasource.map((s)=>{
        return {type: 'line', datasetId: s.name.toString(),}
    })
    const useNormalization = true
    const xtag = 'phenomenonTime'
    const ytag = 'result'
    const dataset = datasource.map((s) => {
        const ref = s.data[0][ytag]
        let obj = {id: s.name.toString()}

        if (useNormalization) {
            obj['source'] = s.data.map((obs) => [obs[xtag], obs[ytag] - ref])
        } else {
            obj['source'] = s.data.map((obs) => [obs[xtag], obs[ytag]])
        }
        return obj
    })

    // console.log('da', dataset)
    // console.log('se', series)
    const option = {
        title: {
            text: name,
            left: 'center'
        },
        dataset: dataset,
        series: series,
        toolbox: {
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                // restore: {},
                saveAsImage: {}
            }
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
                start: 65,
                end: 100
            },
            {
                type: 'inside',
                realtime: true,
                start: 65,
                end: 100
            }
        ],
        xAxis: {
            type: 'time',
            splitLine: {
                show: true // This will display vertical grid lines
            }},
        yAxis: {inverse: true,
                name: 'Depth To Water Below Ground Surface (ft)',
                nameLocation: 'center',
                nameGap: 75,
                scale: true},
    }
    return (
        <div style={{
            height: '400px',
            paddingBottom: 20}}>
            <ReactECharts option={option}
                          style={{width: '100%', height: '100%'}}
            />
        </div>
    )
}
// ============= EOF =============================================