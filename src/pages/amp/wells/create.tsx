import type { HttpError } from "@refinedev/core";
import { Create } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useForm } from "@refinedev/react-hook-form";
import type { IWellForm } from "../../../interfaces/amp";
import { Nullable } from "../../../interfaces";

export const WellCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    formState: { errors },
  } = useForm<IWellForm, HttpError, Nullable<IWellForm>>();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <TextField
          {...register("WellID", {
            required: "This field is required",
          })}
          error={!!errors.WellID}
          helperText={errors.WellID?.message}
          margin="normal"
          fullWidth
          label="Well ID"
          name="WellID"
          autoFocus
        />
        <TextField
          {...register("SiteName", {
            required: "This field is required",
          })}
          error={!!errors.SiteName}
          helperText={errors.SiteName?.message}
          margin="normal"
          fullWidth
          label="Site Name"
          name="SiteName"
          autoFocus
        />
      </Box>
    </Create>
  );
};
