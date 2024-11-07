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

import {FormControl, InputAdornment, InputLabel} from "@mui/material";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

export const ClearableSelect = ({label, value, setValue, values,
                                    multiple=false,
                                    disabled=false,
                                    showClear=true}) => {

    let clear = false;
    if (showClear){
        if (multiple) {
            clear = value.length > 0
        }else{
            clear = value !== ''
        }
    }



    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
                disabled={disabled}
                multiple={multiple}
                variant={'outlined'}
                label={label}
                value={value}
                onChange={(e: SelectChangeEvent) => {
                    setValue(e.target.value as string)
                }}

                endAdornment={
                    clear && (
                        <InputAdornment sx={{marginRight: "15px"}} position="end">
                            <IconButton
                                onClick={() => {

                                    if (multiple) {
                                        setValue([]);
                                    }else {
                                        setValue('');
                                    }
                                }}
                            >
                                <ClearIcon fontSize="small"></ClearIcon>
                            </IconButton>
                        </InputAdornment>
                    )
                }
            >
                {
                    values.map((lt) => {
                        return <MenuItem
                            key={lt}
                            value={lt}>{lt}</MenuItem>
                    })
                }
            </Select>
        </FormControl>
    )
}
// ============= EOF =============================================