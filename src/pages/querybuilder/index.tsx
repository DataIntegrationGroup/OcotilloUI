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
import MapComponent from '../../components/MapComponent';
import TextField from "@mui/material/TextField";
import {Button} from "@mui/material";
import React, {useState} from "react";
import {fetcher} from "../../providers/data-provider";
import { Layer, Map, NavigationControl, Popup, Source } from "react-map-gl";

import {useForm} from "@refinedev/react-hook-form";
import {HttpError} from "@refinedev/core";
import type {Nullable} from "../../interfaces";
import {Create} from "@refinedev/mui";
import {dataProvider} from "../../providers/data-provider";
// import {Layer, Source} from "mapbox-gl";

// {...register("content", {
//     required: "This field is required",
// })}
// error={!!errors.content}
// helperText={errors.content?.message}

// interface IQuery {
//     name: string;
//     material: string;
// };

const toGeoJson = (data: any) => {
    return {'type': 'FeatureCollection',
            'features': data.map((d: any) => {
                return {
                'type': 'Feature',
                'geometry': d.geometry,
                }
            })
    }
}

export const Querybuilder: React.FC= () => {
    const [PointID, setPointID] = useState<string>('');
    const [resultFeatureCollection, setResultFeatureCollection] = useState<any>({type: 'FeatureCollection', features: []})
    // const {
    //     saveButtonProps,
    //     register,
    //     control,
    //     formState: { errors },
    // } = useForm<IQuery, HttpError, Nullable<IQuery>>();

    // const {
    //     refineCore: { onFinish, formLoading, query },
    //     register,
    //     handleSubmit,
    //     formState: { errors },
    //     saveButtonProps,
    // } = useForm<IQuery, HttpError, Nullable<IQuery>>({
    //     refineCoreProps: {
    //         // resource: "products",
    //         // action: "edit",
    //         // id: 123,
    //     },
    // });
    const handleSubmit = (e: any) => {
        let params = new URLSearchParams();
        params.append('filter', JSON.stringify({field: 'PointID', operator: 'startswith', value: PointID}));
        let url = `tabular/locations?${params.toString()}`
        fetcher(url).then((response) => {return response.json()}).then((data) => {
            const geoJson = toGeoJson(data.items)
            setResultFeatureCollection(geoJson)
        })


    }

    return (
        <div>
                <h1>QueryBuilder</h1>
                {/*<Create {...saveButtonProps} >*/}
                {/*<TextField*/}
                {/*    margin="normal"*/}
                {/*    label="Query"*/}
                {/*    multiline*/}
                {/*    rows={4}*/}
                {/*    InputLabelProps={{shrink: true}}*/}
                {/*/>*/}
                <TextField
                    name="PointID"
                    label="PointID"
                    onChange={(e) => setPointID(e.target.value)}
                />

               <Button onClick={handleSubmit}
                    sx={{margin: 3}}
                   variant={'contained'}>Submit</Button>
                <MapComponent
                    showDrawControls={{show: true, position: 'top-right'}}
                >
                    <Source
                    key='foo'
                    id='foo'
                    type='geojson'
                    data={resultFeatureCollection}>
                        <Layer
                            id="location"
                            type="circle"
                            paint={{
                                'circle-radius': 6,
                                'circle-color': '#B42222',
                                'circle-stroke-color': '#ffffff',
                                'circle-stroke-width': 1,
                            }}
                        />
                    </Source>
                </MapComponent>

        </div>
    )
}
// ============= EOF =============================================