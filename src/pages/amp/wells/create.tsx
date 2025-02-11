import type { HttpError } from "@refinedev/core";
import { Create } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useForm } from "@refinedev/react-hook-form";
import type { IWellForm } from "../../../interfaces/amp";
import { Nullable } from "../../../interfaces";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Divider, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Dayjs } from "dayjs";

export const WellCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    formState: { errors },
  } = useForm<IWellForm, HttpError, Nullable<IWellForm>>();

  const [dateTime, setDateTime] = useState<Dayjs | null>(null);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        autoComplete="off"
      >
        <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                {...register("WellID", {
                  required: "This field is required",
                })}
                required={true}
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
            </Stack>
            <Stack direction="row" spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  {...register("DateTime", {
                    required: "This field is required",
                  })}
                  label="Date Time"
                  value={dateTime}
                  onChange={(newDateTime) => setDateTime(newDateTime)}
                />
              </LocalizationProvider>
              <TextField
                {...register("FieldStaff")}
                error={!!errors.FieldStaff}
                helperText={errors.FieldStaff?.message}
                label="Field Staff"
                name="Field Staff"
                fullWidth
                autoFocus
              />
            </Stack>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h3" component="h3">
              Owner Data
            </Typography>
            <TextField
              {...register("Owner.Name")}
              error={!!errors.Owner?.Name}
              helperText={errors.Owner?.Name?.message}
              fullWidth
              label="Owner Name"
              name="Owner Name"
              autoFocus
            />          </Stack>
          <Stack spacing={2}>
            <Typography variant="h3" component="h3">
              Well Data
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Create>
  );
};
