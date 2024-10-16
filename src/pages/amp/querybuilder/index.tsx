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
import MapComponent from '../../../components/MapComponent';
// import TextField from "@mui/material/TextField";
import {Button, Select} from "@mui/material";
import React, {useState} from "react";
import {fetcher} from "../../../providers/amp-data-provider";
import { Layer, Map, NavigationControl, Popup, Source } from "react-map-gl";
import { useAutocomplete } from "@refinedev/mui";
import { Autocomplete, TextField } from "@mui/material";

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

interface ICounty {
    id: number;
    name: string;
}

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
    const [county, setCounty] = useState<ICounty | null>(null);
    const [resultFeatureCollection, setResultFeatureCollection] = useState<any>({type: 'FeatureCollection', features: []})
    const [countyFeature, setCountyFeature] = useState<any>()
    const {autocompleteProps} = useAutocomplete<ICounty>({
        resource: "counties",
    });
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
        console.log('handleSubmit', county)

        let params = new URLSearchParams();
        if (PointID !== '') {
            params.append('filter', JSON.stringify({field: 'PointID', operator: 'startswith', value: PointID}));
        }
        if (county) {
            params.append('county', county.name);
        }

        let url = `tabular/locations?${params.toString()}`
        fetcher(url).then((response) => {return response.data}).then((data) => {
            const geoJson = toGeoJson(data.items)
            setResultFeatureCollection(geoJson)
        })
        url = `tabular/counties/${county.name}`
        fetcher(url).then((response) => {return response.data}).then((data) => {
            // const geoJson = toGeoJson(data.items)
            // setResultFeatureCollection(geoJson)
            console.log('conasd', data)
            setCountyFeature(data)
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
                <Autocomplete
                    {...autocompleteProps}
                    value={county}
                    onChange={(e, value) => setCounty(value)}
                    getOptionLabel={(item) => item.name}
                    isOptionEqualToValue={(option, value) =>
                        value === undefined ||
                        option?.id?.toString() === (value?.id ?? value)?.toString()
                    }
                // placeholder="Select County"
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="County"
                        margin="normal"
                        variant="outlined"
                    />
                )}
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
                    <Source
                        key='county'
                        id='countysource'
                        type='geojson'
                        data={countyFeature}>
                        <Layer
                            id="county"
                            type="fill"
                            paint={{
                                "fill-color": "#9ab7d5",
                                "fill-outline-color": "#000000",
                                "fill-opacity": 0.25,
                            }}
                        />
                    </Source>
                </MapComponent>

        </div>
    )
}
// ============= EOF =============================================