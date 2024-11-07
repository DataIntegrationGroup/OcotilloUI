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

import React, {ReactNode, useState} from 'react';
import { TextField, MenuItem, Select, FormControl, InputLabel, Box } from '@mui/material';
import {SelectChangeEvent} from "@mui/material/Select";
import {useDebounce} from "@/components/util";


const FilterComponent = ({field, setField, operator, setOperator, value, setValue}) => {
    const [inputValue, setInputValue] = useState(value);

    const debounced = useDebounce((v) => {
        setValue(v);
    }, 500);

    const handleFieldChange = (event: SelectChangeEvent<string>, child: ReactNode) => {
        setField(event.target.value as string);
    };

    const handleOperatorChange =(event: SelectChangeEvent<string>, child: ReactNode) => {
        setOperator(event.target.value as string);
    };

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        debounced(event.target.value);
    };

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                <InputLabel id="field-label">Field</InputLabel>
                <Select
                    variant={'outlined'}
                    labelId="field-label"
                    value={field}
                    onChange={handleFieldChange}
                    label="Field"
                >
                    <MenuItem value="WellDepth">Well Depth</MenuItem>
                    <MenuItem value="HoleDepth">Hole Depth</MenuItem>
                </Select>
            </FormControl>

            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                <InputLabel id="operator-label">Operator</InputLabel>
                <Select
                    variant={'outlined'}
                    labelId="operator-label"
                    value={operator}
                    onChange={handleOperatorChange}
                    label="Operator"
                >
                    <MenuItem value="equal">{'equal'}</MenuItem>
                    <MenuItem value="lessThan">{'lessThan'}</MenuItem>
                    <MenuItem value="greaterThan">{'greaterThan'}</MenuItem>
                </Select>
            </FormControl>

            <TextField
                label="Value"
                variant="outlined"
                value={inputValue}
                onChange={handleValueChange}
            />
        </Box>
    );
};

export default FilterComponent;
// ============= EOF =============================================