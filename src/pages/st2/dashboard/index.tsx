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

    const {result: locationsResult} = useList({
        resource: 'Locations',
        dataProviderName: 'st2'
    });

    const {result: thingsResult} = useList({
        resource: 'Things',
        dataProviderName: 'st2'
    });

    const {result: sensorsResult} = useList({
        resource: 'Sensors',
        dataProviderName: 'st2'
    });

    const {result: observationsResult} = useList({
        resource: 'Observations',
        dataProviderName: 'st2'
    });

    const {result: datastreamsResult} = useList({
        resource: 'Datastreams',
        dataProviderName: 'st2'
    });

    const {result: observedPropertiesResult} = useList({
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
                        <Typography variant={'body1'}>{locationsResult?.total}</Typography>
                    </Card>
                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Things</Typography>
                        <Typography variant={'body1'}>{thingsResult?.total}</Typography>
                    </Card>
                </Stack>
                <Stack direction={'row'}>
                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Observations</Typography>
                        <Typography variant={'body1'}>{observationsResult?.total}</Typography>
                    </Card>

                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Datastreams</Typography>
                        <Typography variant={'body1'}>{datastreamsResult?.total}</Typography>
                    </Card>
                </Stack>

                <Stack direction={'row'}>
                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>Sensors</Typography>
                        <Typography variant={'body1'}>{sensorsResult?.total}</Typography>
                    </Card>

                    <Card sx={{'p': 3}}>
                        <Typography variant={'h5'}>ObservedProperties</Typography>
                        <Typography variant={'body1'}>{observedPropertiesResult?.total}</Typography>
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
