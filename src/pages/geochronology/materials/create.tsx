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
import type { HttpError } from "@refinedev/core";
import { Create, useAutocomplete } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm } from "@refinedev/react-hook-form";

import { Controller } from "react-hook-form";

import type { IMaterial } from "../../../interfaces/geochronology";
import type { Nullable } from "../../../interfaces";

export const MaterialCreate: React.FC = () => {
    const {
        saveButtonProps,
        register,
        control,
        formState: { errors },
    } = useForm<IMaterial, HttpError, Nullable<IMaterial>>();

    return (
        <Create saveButtonProps={saveButtonProps}>
        <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column" }}
            autoComplete="off"
        >
            <TextField
            {...register("name", {
                required: "This field is required",
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
            margin="normal"
            fullWidth
            label="Name"
            name="name"
            autoFocus
            required
            />
            <TextField
                {...register("grainsize", {
                    // required: "This field is required",
                })}
                error={!!errors.grainsize}
                helperText={errors.grainsize?.message}
                margin="normal"
                fullWidth
                label="Grain Size"
                name="grainsize"
                required
            />

        </Box>
        </Create>
    );
}

// ============= EOF =============================================
