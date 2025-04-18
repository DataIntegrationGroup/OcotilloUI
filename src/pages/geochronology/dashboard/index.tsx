import Typography from "@mui/material/Typography";
import {Box} from "@mui/system";
import {useShow} from "@refinedev/core";
import {Card} from "@mui/material";
import Stack from "@mui/material/Stack";

export const GeochronologyDashboard = () => {
    const {query} = useShow({
        resource: 'geochronology',
        id: 'dashboard',
        dataProviderName: 'geochronology'
    });
    const stats = query.data?.data
    console.log(query.data?.data)
    return (
        <Box>
                <Typography variant={'h3'}>Geochronology Dashboard</Typography>

            <Stack direction={'column'}
                     spacing={2}
                sx={{justifyContent: 'space-between'}}>
                <Card sx={{'p': 3}}>
                    <Typography variant={'h5'}>Projects</Typography>
                    <Typography variant={'body1'}>{stats?.projects}</Typography>
                </Card>
                <Card sx={{'p': 3}}>
                    <Typography variant={'h5'}>Samples</Typography>
                    <Typography variant={'body1'}>{stats?.samples}</Typography>
                </Card>
                <Card sx={{'p': 3}}>
                    <Typography variant={'h5'}>Materials</Typography>
                    <Typography variant={'body1'}>{stats?.materials}</Typography>
                </Card>
            </Stack>


        </Box>
    )
}
