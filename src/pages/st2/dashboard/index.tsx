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
import {useList, useShow} from "@refinedev/core";
import Box from "@mui/material/Box";
import {DataGrid} from "@mui/x-data-grid";
import {Show} from "@refinedev/mui";
import {alpha} from "@mui/system";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";


export const ST2Dashboard = () => {

    const {data: Locations, isLoading: locationsLoading} = useList({
        resource: 'Locations',
        dataProviderName: 'st2'
    });

    const {data: Things, isLoading: thingsLoading} = useList({
        resource: 'Things',
        dataProviderName: 'st2'
    });

    const {data: Sensors, isLoading: sensorsLoading} = useList({
        resource: 'Sensors',
        dataProviderName: 'st2'
    });

    const {data: Observations, isLoading: observationsLoading} = useList({
        resource: 'Observations',
        dataProviderName: 'st2'
    });

    const {data: Datastreams, isLoading: datastreamsLoading} = useList({
        resource: 'Datastreams',
        dataProviderName: 'st2'
    });

    const {data: ObservedProperties, isLoading: observedPropertiesLoading} = useList({
        resource: 'ObservedProperties',
        dataProviderName: 'st2'
    });

    // const isLoading = locationsLoading || thingsLoading
    // console.log('asdf', Things, Locations)
    return (
        <Box>
            {/*{isLoading && (*/}
            {/*    <Box*/}
            {/*        sx={{*/}
            {/*            position: "absolute",*/}
            {/*            inset: 0,*/}
            {/*            display: "flex",*/}
            {/*            justifyContent: "center",*/}
            {/*            alignItems: "center",*/}
            {/*            zIndex: (theme) => theme.zIndex.drawer + 1,*/}
            {/*            // this is needed to support custom themes, dark mode etc.*/}
            {/*            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.4),*/}
            {/*        }}*/}
            {/*    >*/}
            {/*        <CircularProgress/>*/}
            {/*    </Box>*/}
            {/*)}*/}
            <Typography variant={'h3'}>ST2 Dashboard</Typography>
            <Stack direction={'column'}
                   spacing={2}
                   sx={{justifyContent: 'space-between'}}>
                {/*<Card sx={{'p': 3}}>*/}
                {/*    <DataGrid columns={[{field: 'id', headerName: 'ID', width: 90}]}*/}
                {/*              rows={[]}/>*/}

                {/*    /!*<Typography variant={'h5'}>Projects</Typography>*!/*/}
                {/*    /!*<Typography variant={'body1'}>{stats?.agenc}</Typography>*!/*/}
                {/*</Card>*/}
                <Stack direction={'row'}>
                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Locations</Typography>
                        <Typography variant={'body1'}>{Locations?.total}</Typography>
                    </Card>
                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Things</Typography>
                        <Typography variant={'body1'}>{Things?.total}</Typography>
                    </Card>
                </Stack>
                <Stack direction={'row'}>
                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Observations</Typography>
                        <Typography variant={'body1'}>{Observations?.total}</Typography>
                    </Card>

                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Datastreams</Typography>
                        <Typography variant={'body1'}>{Datastreams?.total}</Typography>
                    </Card>
                </Stack>

                <Stack direction={'row'}>
                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Sensors</Typography>
                        <Typography variant={'body1'}>{Sensors?.total}</Typography>
                    </Card>

                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>ObservedProperties</Typography>
                        <Typography variant={'body1'}>{ObservedProperties?.total}</Typography>
                    </Card>
                </Stack>
                {/*<Card sx={{'p': 3}}>*/}
                {/*    <Typography variant={'h5'}>Manual Measurements</Typography>*/}
                {/*    <Typography variant={'body1'}>{stats?.manual_measurements.count}</Typography>*/}
                {/*    <Typography variant={'h5'}>Last Measurement</Typography>*/}
                {/*    <Typography variant={'body1'}>{stats?.manual_measurements.last_timestamp}</Typography>*/}
                {/*</Card>*/}
                {/*<Card sx={{'p': 3}}>*/}
                {/*    <Typography variant={'h5'}>Continuous Measurements</Typography>*/}
                {/*    <Typography variant={'body1'}>{stats?.continuous_measurements}</Typography>*/}
                {/*</Card>*/}
            </Stack>
        </Box>
    )
}
// ============= EOF =============================================