import type { HttpError } from "@refinedev/core";
import { Create } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useForm } from "@refinedev/react-hook-form";
import type { IWellForm } from "../../../interfaces/amp";
import { Nullable } from "../../../interfaces";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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
        sx={{ display: "flex", flexDirection: "column", rowGap: "1rem" }}
        autoComplete="off"
      >
        <TextField
          {...register("WellID", {
            required: "This field is required",
          })}
          error={!!errors.WellID}
          helperText={errors.WellID?.message}
          fullWidth
          label="Well ID"
          name="WellID"
          autoFocus
        />
        <TextField
          {...register("SiteName")}
          error={!!errors.SiteName}
          helperText={errors.SiteName?.message}
          fullWidth
          label="Site Name"
          name="SiteName"
          autoFocus
        />
        <TextField
          {...register("FieldStaff")}
          error={!!errors.FieldStaff}
          helperText={errors.FieldStaff?.message}
          fullWidth
          label="Field Staff"
          name="Field Staff"
          autoFocus
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            {...register("DateTime", {
              required: "This field is required",
            })}
            label="Date Time"
            name="DateTime"
          />
        </LocalizationProvider>
      </Box>
    </Create>
  );
};
