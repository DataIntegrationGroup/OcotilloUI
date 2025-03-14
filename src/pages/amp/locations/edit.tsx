import { HttpError } from "@refinedev/core";
import { Edit } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useForm } from "@refinedev/react-hook-form";
import { Controller } from "react-hook-form";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Switch } from "@mui/material";
import { Nullable, ILocation } from "@/interfaces";

export const LocationEdit: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<ILocation, HttpError, Nullable<ILocation>>();

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
          error={!!errors.PointID}
          helperText={errors.PointID?.message}
          margin="normal"
          fullWidth
          label="PointID"
          name="PointID"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("SiteID", {})}
          error={!!errors.SiteID}
          helperText={errors.SiteID?.message}
          margin="normal"
          fullWidth
          label="SiteID"
          name="SiteID"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => {
            return (
              <FormControlLabel
                control={<Switch checked={value} onChange={onChange} />}
                label="PublicRelease"
              />
            );
          }}
          name={"PublicRelease"}
        />
      </Box>
    </Edit>
  );
};
