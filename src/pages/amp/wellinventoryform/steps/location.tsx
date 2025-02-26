import { Box, TextField } from "@mui/material";
import { Controller } from "react-hook-form";

export const LocationStep = ({ control, formState, register }) => {
  const { errors } = formState;

  return (
    <Box>
      <Controller
        name={"pointid"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Point ID"}
            error={!!errors.pointid}
            helperText={errors.pointid && `${errors.pointid.message}`}
            type={"number"}
            fullWidth
            sx={{ maxWidth: 600 }}
            margin={"dense"}
          />
        )}
      />

      <hr />

      <Controller
        name={"latitude"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Latitude"}
            error={!!errors.latitude}
            helperText={errors.latitude && `${errors.latitude.message}`}
            type={"number"}
            fullWidth
            sx={{ maxWidth: 600 }}
            margin={"dense"}
          />
        )}
      />

      <Controller
        name={"longitude"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Longitude"}
            error={!!errors.longitude}
            helperText={errors.longitude && `${errors.longitude.message}`}
            type={"number"}
            fullWidth
            sx={{ maxWidth: 600 }}
            margin={"dense"}
          />
        )}
      />

      <Controller
        name={"easting"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Easting"}
            error={!!errors.easting}
            helperText={errors.easting && `${errors.easting.message}`}
            type={"number"}
            fullWidth
            sx={{ maxWidth: 600 }}
            margin={"dense"}
          />
        )}
      />

      <Controller
        name={"northing"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Northing"}
            error={!!errors.northing}
            helperText={errors.northing && `${errors.northing.message}`}
            type={"number"}
            fullWidth
            sx={{ maxWidth: 600 }}
            margin={"dense"}
          />
        )}
      />

      <Controller
        name={"elevation"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Elevation"}
            error={!!errors.elevation}
            helperText={errors.elevation && `${errors.elevation.message}`}
            type={"number"}
            fullWidth
            sx={{ maxWidth: 600 }}
            margin={"dense"}
          />
        )}
      />

      <Controller
        name={"elevation_units"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Units"}
            error={!!errors.elevation_units}
            helperText={
              errors.elevation_units && `${errors.elevation_units.message}`
            }
            fullWidth
            sx={{ maxWidth: 200 }}
            margin={"dense"}
          />
        )}
      />

      <Controller
        name={"elevation_datum"}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Datum"}
            error={!!errors.elevation_datum}
            helperText={
              errors.elevation_datum && `${errors.elevation_datum.message}`
            }
            fullWidth
            sx={{ maxWidth: 200 }}
            margin={"dense"}
          />
        )}
      />
    </Box>
  );
};
// ============= EOF =============================================
