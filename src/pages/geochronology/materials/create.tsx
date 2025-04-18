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
