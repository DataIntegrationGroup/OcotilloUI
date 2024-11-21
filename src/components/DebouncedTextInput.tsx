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

import {InputAdornment, TextField} from "@mui/material";
import React, {useState} from "react";
import {useDebounce} from "@/components/util";
import type {IObservation} from "@/interfaces/st2";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

export const DebouncedTextInput: React.FC<{value: any,
    setValue: any,
    options?: any,
    clear?: boolean
    delay?: number}> = ({value, setValue, options, delay=500, clear=true})=>{
    const [inputValue, setInputValue] = useState(value);

    const debounced = useDebounce((v) => {
        setValue(v);
    }, delay);

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value)
        debounced(event.target.value)
    };

    const onClear = ()=>{
        setInputValue('');
        setValue('')
    }

    if (!options){
        options={label: 'Value', variant: 'outlined'}
    }

    return (
        <TextField
            {...options}
            value={inputValue}
            onChange={handleValueChange}
            InputProps={{
            endAdornment:  inputValue ? (
                        <InputAdornment sx={{marginRight: "15px"}} position="end">
                            <IconButton
                                onClick={() => {onClear();}}
                            >
                                <ClearIcon fontSize="small"></ClearIcon>
                            </IconButton>
                        </InputAdornment>
                    ): undefined

            }}
            // endAdornment={
            //     clear && (
            //         <InputAdornment sx={{marginRight: "15px"}} position="end">
            //             <IconButton
            //                 onClick={() => {onSetValue('');}}
            //             >
            //                 <ClearIcon fontSize="small"></ClearIcon>
            //             </IconButton>
            //         </InputAdornment>
            //     )
            // }
        />
    )
}
// ============= EOF =============================================