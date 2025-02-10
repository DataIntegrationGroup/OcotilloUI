// ===============================================================================
// Copyright 2025 Jake Ross
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

import {useForm} from "@refinedev/react-hook-form";
import {IWellInventoryForm} from "@/interfaces/amp";
import {Box, TextField} from "@mui/material";
import Stack from "@mui/material/Stack";
import {Controller} from "react-hook-form";

import * as Yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";


export const WellStep = ({control, formState, register}) => {

    return (
        <Box>


            <Controller name={'well_depth'}
                        control={control}
                        render={({field}) => (
                            <TextField {...field}
                                       label={'Well Depth'}
                                       error={!!formState.well_depth}
                                       helperText={formState.well_depth && `${formState.well_depth.message}`}
                                       type={'number'}
                                       fullWidth
                                       sx={{maxWidth: 600}}
                                       margin={'dense'}/>
                        )}/>

        </Box>
    )
}
// ============= EOF =============================================