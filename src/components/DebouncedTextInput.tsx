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

import {TextField} from "@mui/material";
import React, {useState} from "react";
import {useDebounce} from "@/components/util";
import type {IObservation} from "@/interfaces/st2";

export const DebouncedTextInput: React.FC<{value: any,
    setValue: any,
    options?: any,
    delay?: number}> = ({value, setValue, options, delay=500})=>{
    const [inputValue, setInputValue] = useState(value);

    const debounced = useDebounce((v) => {
        setValue(v);
    }, delay);

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        debounced(event.target.value);
    };

    if (!options){
        options={label: 'Value', variant: 'outlined'}
    }

    return (
        <TextField
            {...options}
            value={inputValue}
            onChange={handleValueChange}
        />
    )
}
// ============= EOF =============================================