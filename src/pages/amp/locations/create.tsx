import type { HttpError } from "@refinedev/core";
import { Create } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useForm } from "@refinedev/react-hook-form";
import { Nullable, ILocation } from "@/interfaces";

export const LocationCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    formState: { errors },
  } = useForm<ILocation, HttpError, Nullable<ILocation>>();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <TextField
          {...register("PointID", {
            required: "This field is required",
          })}
          error={!!errors.PointID}
          helperText={errors.PointID?.message}
          margin="normal"
          fullWidth
          label="PointID"
          name="PointID"
          autoFocus
        />
        <TextField
          {...register("SiteID", {
            required: "This field is required",
          })}
          error={!!errors.SiteID}
          helperText={errors.SiteID?.message}
          margin="normal"
          fullWidth
          label="SiteID"
          name="SiteID"
          autoFocus
        />
      </Box>
    </Create>
  );
};
