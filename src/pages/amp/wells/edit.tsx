import type { HttpError } from "@refinedev/core";
import { Edit, useAutocomplete } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm } from "@refinedev/react-hook-form";

import { Controller } from "react-hook-form";

import type { IWell, ICategory, IStatus, Nullable } from "../../../interfaces/amp";
import FormControlLabel from "@mui/material/FormControlLabel";
import {Switch} from "@mui/material";

export const WellEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    formState: { errors },
  } = useForm<IWell, HttpError, Nullable<IWell>>();

  // const { autocompleteProps } = useAutocomplete<ICategory>({
  //   resource: "categories",
  //   defaultValue: queryResult?.data?.data.category.id,
  // });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <TextField
          {...register("PointID", {
            required: "This field is required",
          })}
            disabled
          error={!!errors.PointID}
          helperText={errors.PointID?.message}
          margin="normal"
          fullWidth
          label="PointID"
          name="PointID"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Edit>
  );
};
