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
import {useShow} from "@refinedev/core";
import Box from "@mui/material/Box";


export const WaterDashboard = () => {

    const {query} = useShow({
        resource: 'dashboard',
        id: 'dashboard',
        dataProviderName: 'amp'
    });
    const stats = query.data?.data
    console.log(query.data?.data)

    return (
        <Box>
            <Typography variant={'h3'}>Water Dashboard</Typography>
            <Stack direction={'column'}
                   spacing={2}
                   sx={{justifyContent: 'space-between'}}>
                <Card sx={{'p': 3}}>
                    <Typography variant={'h5'}>Projects</Typography>
                    <Typography variant={'body1'}>{stats?.projects}</Typography>
                </Card>
                <Card sx={{'p': 3}}>
                    <Typography variant={'h5'}>Wells</Typography>
                    <Typography variant={'body1'}>{stats?.wells}</Typography>
                </Card>
                <Card sx={{'p': 3}}>
                    <Typography variant={'h5'}>Manual Measurements</Typography>
                    <Typography variant={'body1'}>{stats?.manual_measurements.count}</Typography>
                    <Typography variant={'h5'}>Last Measurement</Typography>
                    <Typography variant={'body1'}>{stats?.manual_measurements.last_timestamp}</Typography>
                </Card>
                <Card sx={{'p': 3}}>
                    <Typography variant={'h5'}>Continuous Measurements</Typography>
                    <Typography variant={'body1'}>{stats?.continuous_measurements}</Typography>
                </Card>
            </Stack>
        </Box>
    )
}
// ============= EOF =============================================