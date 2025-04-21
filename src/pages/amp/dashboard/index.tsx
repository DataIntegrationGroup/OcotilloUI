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
