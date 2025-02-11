import type { HttpError } from "@refinedev/core";
import { Create } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import type { IWellForm } from "../../../interfaces/amp";
import { Nullable } from "../../../interfaces";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import {
  TextField,
  Box,
  Grid,
  Typography,
  Divider,
  useMediaQuery,
  useTheme
} from "@mui/material";
import type { Dayjs } from "dayjs";

export const WellCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    formState: { errors },
  } = useForm<IWellForm, HttpError, Nullable<IWellForm>>();

  const [dateTime, setDateTime] = useState<Dayjs | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box component="form" autoComplete="off">
        <Grid container spacing={2}>
          <Grid container item spacing={2} xs={12} md={6} direction={isMobile ? "column" : "row"}>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("WellID", { required: "This field is required" })}
                required
                error={!!errors.WellID}
                helperText={errors.WellID?.message}
                fullWidth
                label="Well ID"
                name="WellID"
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("SiteName")}
                error={!!errors.SiteName}
                helperText={errors.SiteName?.message}
                fullWidth
                label="Site Name"
                name="SiteName"
              />
            </Grid>
          </Grid>
          <Grid container item spacing={2} xs={12} md={6} direction={isMobile ? "column" : "row"}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  sx={{ width: '100%' }}
                  label="Date Time"
                  value={dateTime}
                  onChange={(newDateTime) => setDateTime(newDateTime)}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("FieldStaff")}
                error={!!errors.FieldStaff}
                helperText={errors.FieldStaff?.message}
                fullWidth
                label="Field Staff"
                name="FieldStaff"
              />
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider />
            <Typography variant="h6">Owner Data</Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              {...register("Owner.Name")}
              error={!!errors.Owner?.Name}
              helperText={errors.Owner?.Name?.message}
              fullWidth
              label="Owner Name"
              name="Owner Name"
            />
          </Grid>
          <Grid item xs={12}>
            <Divider />
            <Typography variant="h6">Well Data</Typography>
          </Grid>
        </Grid>
      </Box>
    </Create>
  );
};
