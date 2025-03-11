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
import {Box} from "@mui/system";
import {useShow} from "@refinedev/core";
import {Card} from "@mui/material";
import Stack from "@mui/material/Stack";
import MapComponent from "@/components/MapComponent";
import {Layer, Source} from "react-map-gl";
import React, {useState} from "react";
import {GeothermalSetMapPopupContent} from "@/components/MapPopupComponent";
import counties from "@/data/nmcounties.json";


export const SubsurfaceDashboard = () => {
    // const {query} = useShow({
    //     resource: 'geothermal',
    //     id: 'dashboard',
    //     dataProviderName: 'geothermal'
    // });
    // const stats = query.data?.data
    // console.log(query.data?.data)

    const [popupContent, setPopupContent] = useState<any>(null);
    // const onMouseMove = (e: any, features: any[], mapRef: any) => {
    //     features = features.filter((f) => f.layer.id === 'location')
    //     if (features.length > 0) {
    //         mapRef.current.getCanvas().style.cursor = 'pointer'
    //         GeothermalSetMapPopupContent({features, setPopupContent})
    //     } else {
    //         mapRef.current.getCanvas().style.cursor = 'grab'
    //         setPopupContent(null)
    //     }
    // }
    const {query} = useShow({
        resource: 'wells',
        id: 'locations',
        dataProviderName: 'subsurface'
    });
    const {data, isLoading} = query
    const featureCollection = data?.data

    return (
        <Box>
            <Typography variant={'h3'}>Subsurface Dashboard</Typography>

            {/*<Stack direction={'column'}*/}
            {/*         spacing={2}*/}
            {/*    sx={{justifyContent: 'space-between'}}>*/}
            {/*    <Card sx={{'p': 3}}>*/}
            {/*        <Typography variant={'h5'}>Projects</Typography>*/}
            {/*        <Typography variant={'body1'}>{stats?.projects}</Typography>*/}
            {/*    </Card>*/}
            {/*    <Card sx={{'p': 3}}>*/}
            {/*        <Typography variant={'h5'}>Samples</Typography>*/}
            {/*        <Typography variant={'body1'}>{stats?.samples}</Typography>*/}
            {/*    </Card>*/}
            {/*    <Card sx={{'p': 3}}>*/}
            {/*        <Typography variant={'h5'}>Materials</Typography>*/}
            {/*        <Typography variant={'body1'}>{stats?.materials}</Typography>*/}
            {/*    </Card>*/}
            {/*</Stack>*/}
            <MapComponent
                isLoading={isLoading}
                showDrawControls={{show: true, position: 'top-right'}}
                // setSelectionPolygons={setSelectionPolygons}
                setPopupContent={setPopupContent}
                popupContent={popupContent}
                // onMouseMoveCallback={onMouseMove}
            >
                <Source
                    key='foo'
                    id='foo'
                    type='geojson'
                    data={featureCollection}>
                    <Layer
                        id="location"
                        type="circle"
                        paint={{
                            'circle-radius': 3,
                            // 'circle-color': '#f8600d',
                            'circle-color': [
                                'match',
                                ['get', 'county'],
                                'Socorro', '#224bb4',
                                'Bernalillo', '#daa210',
                                'Chaves', '#b42722',
                                'Catron', '#d5633a',
                                'Cibola', '#517938',
                                'Colfax', '#79878f',
                                'Curry', '#64b976',
                                'De Baca', '#987f7f',
                                'Dona Ana', '#6b82d9',
                                'Eddy', '#66838a',
                                'Grant', '#d9b76b',
                                'Guadalupe', '#d9b76b',
                                'Harding', '#d9b76b',
                                'Hidalgo', '#d9b76b',
                                'Lea', '#d9b76b',
                                'Lincoln', '#d9b76b',
                                'Los Alamos', '#d96b91',
                                'Luna', '#d9b76b',
                                'McKinley', '#d9b76b',
                                'Mora', '#7a1338',
                                'Otero', '#d9b76b',
                                'Quay', '#d9b76b',
                                'Rio Arriba', '#9d7d32',
                                'Roosevelt', '#d9b76b',
                                'San Juan', '#4f5e98',
                                'San Miguel', '#d9b76b',
                                'Sandoval', '#d9b76b',
                                'Santa Fe', '#d9b76b',
                                'Sierra', '#d9b76b',
                                'Taos', '#d9b76b',
                                'rgba(255,255,255,0)'
                            ],
                            'circle-stroke-color': '#000000',
                            'circle-stroke-width': 1,
                        }}
                    />
                </Source>

                <Source
                    key='county'
                    id='countysource'
                    type='geojson'
                    data={counties}>
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

        </Box>
    )
}
// ============= EOF =============================================