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

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {ExportButton} from "@refinedev/mui";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {useExport} from "@refinedev/core";
import {FormControl, InputAdornment, InputLabel} from "@mui/material";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {useState} from "react";
import {ClearableSelect} from "@/components/ClearableSelect";
import {ANALYTES, ExportTypes} from "@/components/enums";



export const ExportControl = ({disabled, params}) => {
    const [exportType, setExportType] = useState<string>('Locations');
    const [analytes, setAnalytes] = useState<string[]>([]);

    // params['analytes'] = analytes.join(', ')
    // params['analytes'] = 'TDS, Ca, Cl, K'
    const {triggerExport: triggerExportCustom, isLoading: isLoadingExportCustom} = useExport({
        resource: exportType.toLowerCase(),
        pageSize: 1000,
        meta: {
            params: {...params, analytes: analytes.join(', ')}
            // exportConfig: exportConfig
        }
    })

    return (
        <div>
            <Stack direction={"row"}>
                <ExportButton
                    disabled={disabled}
                    loadingPosition={'start'}
                    startIcon={<SearchOutlinedIcon/>}
                    onClick={triggerExportCustom}
                    loading={isLoadingExportCustom}
                    variant={'contained'}
                    sx={{margin: 2}}
                >
                    Run Export
                </ExportButton>
                <ClearableSelect
                    label={'Export Type'}
                    value={exportType}
                    setValue={setExportType}
                    values={ExportTypes}
                    showClear={false}
                />

                <ClearableSelect
                    label={'Analytes'}
                    value={analytes}
                    setValue={setAnalytes}
                    values={ANALYTES}
                    multiple={true}
                    disabled={exportType !== 'WaterChemistry'}
                />
            </Stack>

        </div>
    )
}
// ============= EOF =============================================