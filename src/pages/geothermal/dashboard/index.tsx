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

import Typography from '@mui/material/Typography'
import { Box } from '@mui/system'
import { useShow } from '@refinedev/core'
import { Card } from '@mui/material'
import Stack from '@mui/material/Stack'

export const GeothermalDashboard = () => {
  // const {query} = useShow({
  //     resource: 'geothermal',
  //     id: 'dashboard',
  //     dataProviderName: 'geothermal'
  // });
  // const stats = query.data?.data
  // console.log(query.data?.data)
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


    </Box>
  )
}
// ============= EOF =============================================