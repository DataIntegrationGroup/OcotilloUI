// ===============================================================================
// Copyright 2025 New Mexico Bureau of Geology & Mineral Resources (NMBGMR)
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

import { IWellInventoryForm, IWellOwner } from "@/interfaces/amp";
import { useForm } from "@refinedev/react-hook-form";
import { Controller, FieldError } from "react-hook-form";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  TextField,
  Box,
  Grid,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Button
} from "@mui/material";
import wellInventoryFormSchema, { wellInventoryFormDefaults } from "./schema";
import { yupResolver } from "@hookform/resolvers/yup";

export const WellInventoryForm = () => {
  const { register, formState: { errors }, control, handleSubmit, reset } = useForm<IWellInventoryForm>({
    resolver: yupResolver(wellInventoryFormSchema),
    defaultValues: wellInventoryFormDefaults
  });

  const onSubmit = (formData: IWellInventoryForm): void => {
    console.log("✅ onSubmit function executed!");
    console.log("Form Data:", formData);
    alert("Form submitted successfully! Check the console.");
  };

  const onError = (errors: Record<string, any>): void => {
    const errorCount = Object.keys(errors).length; // Count total errors

    console.log(`❌ Validation Errors (${errorCount}):`, errors);
    alert(`Validation failed! ${errorCount} field(s) have errors`);
  };

  return (
    <Card>
      <CardHeader title="Well Inventory Form" />
      <CardContent>
        <Box component="form" autoComplete="off">
          <Grid container spacing={2} direction={{ xs: "column", sm: "row" }}>
            <Grid container item spacing={2} xs={12} md={6} direction={{ xs: "column", sm: "row" }}>
              <Grid item xs={12} sm={6} md={12} lg={6}>
                <TextField
                  {...register("PointID")}
                  required
                  error={!!errors.PointID}
                  helperText={errors.PointID?.message as string || ""}
                  fullWidth
                  label="Point ID"
                  name="PointID"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6} md={12} lg={6}>
                <TextField
                  {...register("SiteName")}
                  required
                  error={!!errors.SiteName}
                  helperText={errors.SiteName?.message as string || ""}
                  fullWidth
                  label="Site Name"
                  name="SiteName"
                />
              </Grid>
            </Grid>
            <Grid container item spacing={2} xs={12} md={6} direction={{ xs: "column", sm: "row" }}>
              <Grid item xs={12} sm={6} md={12} lg={6}>
                <Controller
                  control={control}
                  name="DateTime"
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker
                        {...field}
                        sx={{ width: '100%' }}
                        label="Date Time"
                        slotProps={{
                          textField: {
                            required: true,
                            fullWidth: true,
                            error: !!errors.DateTime,
                            helperText: errors.DateTime?.message as string || "",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={12} lg={6}>
                <TextField
                  {...register("FieldStaff")}
                  required
                  error={!!errors.FieldStaff}
                  fullWidth
                  helperText={errors.FieldStaff?.message as string || ""}
                  label="Field Staff"
                  name="FieldStaff"
                />
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h3">Owner Data</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...register("Owner.Name")}
                error={!!errors.Owner?.Name as boolean || false}
                fullWidth
                helperText={errors.Owner?.Name?.message as String || ""}
                label="Owner Name"
                name="Owner.Name"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h3">Well Data</Typography>
              <Controller
                control={control}
                name="DateDrilled"
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      {...field}
                      sx={{ width: '100%' }}
                      label="Date Time"
                      slotProps={{
                        textField: {
                          required: true,
                          fullWidth: true,
                          error: !!errors.DateDrilled,
                          helperText: errors.DateDrilled?.message as string || "",
                        },
                      }}
                    />
                  </LocalizationProvider>
                )}
              />
            </Grid>
          </Grid>
          <Grid container item spacing={2} sx={{ marginTop: '1rem' }}>
            <Button
              variant="contained"
              type="button"
              onClick={() => reset(wellInventoryFormDefaults)}
            >
              Reset
            </Button>
            <Button variant="contained" type="button">Save</Button>
            <Button
              variant="contained"
              type="button"
              onClick={handleSubmit(onSubmit, onError)}
            >
              Submit
            </Button>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}
// ============= EOF =============================================
