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

import { Box, Typography } from '@mui/material';

export const LegendComponent = (
    {items}
) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography variant="h6">Legend</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                {items.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, backgroundColor: item.color }}></Box>
                        <Typography variant="body2">{item.label}</Typography>
                    </Box>
                ))}
                {/*<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>*/}
                {/*    <Box sx={{ width: 10, height: 10, backgroundColor: '#f4a460' }}></Box>*/}
                {/*    <Typography variant="body2">Surface water (river)</Typography>*/}
                {/*</Box>*/}
                {/*<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>*/}
                {/*    <Box sx={{ width: 10, height: 10, backgroundColor: '#0000ff' }}></Box>*/}
                {/*    <Typography variant="body2">Surface water (lake)</Typography>*/}
                {/*</Box>*/}
                {/*<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>*/}
                {/*    <Box sx={{ width: 10, height: 10, backgroundColor: '#00ff00' }}></Box>*/}
                {/*    <Typography variant="body2">Surface water (pond)</Typography>*/}
                {/*</Box>*/}
                {/*<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>*/}
                {/*    <Box sx={{ width: 10, height: 10, backgroundColor: '#ff0000' }}></Box>*/}
                {/*    <Typography variant="body2">Surface water (reservoir)</Typography>*/}
                {/*</Box>*/}
                {/*<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>*/}
                {/*    <Box sx={{ width: 10, height: 10, backgroundColor: '#b42722' }}></Box>*/}
                {/*    <Typography variant="body2">Ephemeral stream</Typography>*/}
                {/*</Box>*/}
                {/*<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>*/}
                {/*    <Box sx={{ width: 10, height: 10, backgroundColor: '#224bb4' }}></Box>*/}
                {/*    <Typography variant="body2">Groundwater (well)</Typography>*/}
                {/*</Box>*/}
                {/*<Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>*/}
                {/*    <Box sx={{ width: 10, height: 10, backgroundColor: '#000000' }}></Box>*/}
                {/*    <Typography variant="body2">Unknown</Typography>*/}
                {/*</Box>*/}
            </Box>
        </Box>
    );
}

// ============= EOF =============================================