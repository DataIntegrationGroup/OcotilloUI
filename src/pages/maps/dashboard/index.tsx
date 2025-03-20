// ===============================================================================
// Author:  Jake Ross
// Copyright 2025 New Mexico Bureau of Geology & Mineral Resources
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
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


export const MapsDashboard = () => {
    // const {query} = useShow({
    //     resource: 'maps',
    //     id: 'dashboard',
    //     dataProviderName: 'maps'
    // });

    // const {data, isLoading} = query
    // const featureCollection = data?.data

    return (
        <Box>
            <Typography variant={'h3'}>Maps Dashboard</Typography>

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

        </Box>
    )
}
// ============= EOF =============================================