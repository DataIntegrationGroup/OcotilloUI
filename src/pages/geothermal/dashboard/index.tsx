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

export const GeothermalDashboard = () => {
    // const {query} = useShow({
    //     resource: 'geothermal',
    //     id: 'dashboard',
    //     dataProviderName: 'geothermal'
    // });
    // const stats = query.data?.data
    // console.log(query.data?.data)

    const [popupContent, setPopupContent] = useState<any>(null);
    const onMouseMove = (e: any, features: any[], mapRef: any) => {
        features = features.filter((f) => f.layer.id === 'location')
        if (features.length > 0) {
            mapRef.current.getCanvas().style.cursor = 'pointer'
            GeothermalSetMapPopupContent({features, setPopupContent})
        } else {
            mapRef.current.getCanvas().style.cursor = 'grab'
            setPopupContent(null)
        }
    }
    const {query} = useShow({
        resource: 'wells',
        id: 'locations',
        dataProviderName: 'geothermal'
    });
    const {data, isLoading} = query
    const featureCollection = data?.data
    return (
        <Box>
            <Typography variant={'h3'}>Geothermal Dashboard</Typography>

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
                onMouseMoveCallback={onMouseMove}
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
                            'circle-color': '#f8600d',
                            // [
                            //     'match',
                            //     ['get', 'site_type'],
                            //     'Groundwater other than spring (well)', '#224bb4',
                            //     'Spring', '#517938',
                            //     'Ephemeral stream', '#b42722',
                            //     'Perennial stream', '#d5633a',
                            //     '#000000'
                            // ],
                            'circle-stroke-color': '#224bb4',
                            'circle-stroke-width': 1,
                        }}
                    />
                </Source>
                {/*{countyFeature && <Source*/}
                {/*    key='county'*/}
                {/*    id='countysource'*/}
                {/*    type='geojson'*/}
                {/*    data={countyFeature}>*/}
                {/*    <Layer*/}
                {/*        id="county"*/}
                {/*        type="fill"*/}
                {/*        paint={{*/}
                {/*            "fill-color": "#9ab7d5",*/}
                {/*            "fill-outline-color": "#000000",*/}
                {/*            "fill-opacity": 0.25,*/}
                {/*        }}*/}
                {/*    />*/}
                {/*</Source>}*/}
            </MapComponent>

        </Box>
    )
}
// ============= EOF =============================================