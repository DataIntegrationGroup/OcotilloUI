import { useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { IWellInventoryForm } from "@/interfaces/amp";
import { yupResolver } from "@hookform/resolvers/yup";
import { WellInventorySchema, SchemaDefaults } from "./well_inventory.schema";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  ControlledEmailField,
  ControlledSelectField,
  ControlledTextField,
} from "@/components";
import { useTheme } from "@mui/material";
import { ControlledPhoneField } from "@/components/ControlledPhoneField";
import { ControlledOSMAddressAutocomplete } from "@/components/ControlledOSMAddressAutocomplete";

export const WellInventoryForm = () => {
  const theme = useTheme();

  const [_, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NM");
  const [zip, setZip] = useState("");

  const {
    refineCore: { onFinish },
    formState: { errors },
    control,
    handleSubmit,
    reset,
  } = useForm<IWellInventoryForm>({
    defaultValues: SchemaDefaults,
    resolver: yupResolver(WellInventorySchema),
    mode: "onTouched",
  });

  return (
    <Card>
      <CardHeader title="Well Inventory Form" />
      <CardContent sx={{ padding: "2.5rem" }}>
        <Box
          component="form"
          autoComplete="off"
          onSubmit={handleSubmit(onFinish)}
        >
          <Grid
            container
            spacing={2}
            direction={{ xs: "column", sm: "row" }}
            sx={{
              maxWidth: theme.breakpoints.values.lg,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <Grid
              container
              sx={{ width: "100%" }}
              direction={{ xs: "column", sm: "row" }}
            >
              <Grid size={12}>
                <Typography variant="h2">Project</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <ControlledSelectField
                  required
                  label="PointId Prefix"
                  control={control}
                  name="project.pointid_prefix"
                  options={[
                    { value: 1, label: "One" },
                    { value: 2, label: "Two" },
                    { value: 3, label: "Three" },
                  ]}
                  errorMessage={errors.project?.pointid_prefix?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <ControlledSelectField
                  required
                  label="Project Name"
                  control={control}
                  name="project.project"
                  options={[
                    { value: 1, label: "One" },
                    { value: 2, label: "Two" },
                    { value: 3, label: "Three" },
                  ]}
                  errorMessage={errors.project?.project?.message}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} direction={{ xs: "column", sm: "row" }}>
              <Grid size={12}>
                <Typography variant="h2">Owner Data</Typography>
              </Grid>
              <Grid size={12}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    required
                    label="Owner Key"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.owner_key"
                    errorMessage={errors.owner?.owner_key?.message}
                  />
                </Grid>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <ControlledTextField
                  required
                  label="First Name"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.first_name"
                  errorMessage={errors.owner?.first_name?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <ControlledTextField
                  required
                  label="Last Name"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.last_name"
                  errorMessage={errors.owner?.last_name?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <ControlledTextField
                  label="First Name (Secondary)"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.second_first_name"
                  errorMessage={errors.owner?.second_first_name?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <ControlledTextField
                  label="Last Name (Secondary)"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.second_last_name"
                  errorMessage={errors.owner?.second_last_name?.message}
                />
              </Grid>
              <Grid
                container
                spacing={2}
                size={12}
                sx={{
                  marginLeft: "0rem !important",
                  marginRight: "0rem !important",
                }}
                direction={{ xs: "column", sm: "row" }}
              >
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <ControlledPhoneField
                    required
                    label="Cell Phone"
                    fullWidth
                    control={control}
                    type="tel"
                    name="owner.cell_phone"
                    errorMessage={errors.owner?.cell_phone?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <ControlledPhoneField
                    label="Home Phone"
                    fullWidth
                    control={control}
                    type="tel"
                    name="owner.phone"
                    errorMessage={errors.owner?.phone?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <ControlledEmailField
                    required
                    label="Email"
                    control={control}
                    name="owner.email"
                    errorMessage={errors.owner?.email?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 6, xl: 3 }} offset={{ xl: 3 }}>
                  <ControlledPhoneField
                    label="Phone (Secondary)"
                    control={control}
                    name="owner.second_ctct_phone"
                    errorMessage={errors.owner?.second_ctct_phone?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <ControlledEmailField
                    label="Email (Secondary)"
                    control={control}
                    name="owner.second_ctct_email"
                    errorMessage={errors.owner?.second_ctct_email?.message}
                  />
                </Grid>
              </Grid>
              <Grid size={12}>
                <Typography variant="h4">Physical</Typography>
              </Grid>
              <Grid size={12}>
                <ControlledOSMAddressAutocomplete
                  required
                  label="Address"
                  fullWidth
                  control={control}
                  name="owner.physical_address"
                  errorMessage={errors.owner?.physical_address?.message}
                  onAddressSelect={(
                    selectedAddress: string,
                    selectedCity: string,
                    selectedState: string,
                    selectedZip: string,
                  ) => {
                    setAddress(selectedAddress);
                    setCity(selectedCity);
                    setState(selectedState);
                    setZip(selectedZip);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <ControlledTextField
                  required
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.physical_city"
                  errorMessage={errors.owner?.physical_city?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <ControlledTextField
                  required
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.physical_state"
                  errorMessage={errors.owner?.physical_state?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <ControlledTextField
                  required
                  label="Zip Code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.physical_zip_code"
                  errorMessage={errors.owner?.physical_zip_code?.message}
                />
              </Grid>
              <Grid
                container
                size={12}
                alignItems="center"
                columnGap={1}
                rowGap={0}
              >
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <Typography variant="h4">Mailing </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: "grow" }}>
                  <Typography variant="body1">
                    (if different from physical address)
                  </Typography>
                </Grid>
              </Grid>
              <Grid size={12}>
                <ControlledTextField
                  label="Address"
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.mailing_address"
                  errorMessage={errors.owner?.mailing_address?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <ControlledTextField
                  label="City"
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.mail_city"
                  errorMessage={errors.owner?.mail_city?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <ControlledTextField
                  label="State"
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.mail_state"
                  errorMessage={errors.owner?.mail_state?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <ControlledTextField
                  label="Zip Code"
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.mail_zip_code"
                  errorMessage={errors.owner?.mail_zip_code?.message}
                />
              </Grid>
            </Grid>
            <Grid size={12}>
              <Typography variant="h2">Location</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ControlledTextField
                label="Site ID"
                fullWidth
                required
                control={control}
                name="location.site_id"
                errorMessage={errors.location?.site_id?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ControlledTextField
                label="Site ID (Alternate)"
                fullWidth
                control={control}
                name="location.alternate_site_id"
                errorMessage={errors.location?.alternate_site_id?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ControlledTextField
                label="Site Name"
                fullWidth
                required
                control={control}
                name="location.site_name"
                errorMessage={errors.location?.site_name?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 5 }}>
              <ControlledTextField
                required
                label="Easting (NAD83)"
                fullWidth
                control={control}
                name="location.coordinates.x"
                errorMessage={errors.location?.coordinates?.x?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 5 }}>
              <ControlledTextField
                required
                label="Northing (NAD83)"
                fullWidth
                control={control}
                name="location.coordinates.y"
                errorMessage={errors.location?.coordinates?.y?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 2 }}>
              <ControlledSelectField
                required
                label="Coordinate Type"
                control={control}
                name="location.coordinates.type"
                options={[
                  { value: "gcs", label: "GCS" },
                  { value: "utm", label: "UTM" },
                ]}
                errorMessage={errors.location?.coordinates?.type?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ControlledTextField
                required
                label="Altitude"
                control={control}
                name="location.altitude"
                errorMessage={errors.location?.altitude?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ControlledTextField
                required
                label="UTM Datum"
                control={control}
                name="location.utm_datum"
                errorMessage={errors.location?.utm_datum?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ControlledTextField
                required
                label="ALT Datum"
                control={control}
                name="location.alt_datum"
                errorMessage={errors.location?.alt_datum?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <ControlledSelectField
                required
                label="Altitude Method"
                control={control}
                name="location.altitude_method"
                options={[
                  { value: "gcs", label: "GCS" },
                  { value: "survey", label: "Survey" },
                  { value: "map", label: "Map" },
                  { value: "altimeter", label: "Altimeter" },
                  { value: "differential-gps", label: "Differential GPS" },
                ]}
                errorMessage={errors.location?.altitude_method?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <ControlledSelectField
                required
                label="Site Type"
                control={control}
                name="location.site_type"
                options={[
                  { value: "gcs", label: "GCS" },
                  { value: "utm", label: "UTM" },
                ]}
                errorMessage={errors.location?.site_type?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                multiline
                label="Notes"
                control={control}
                name="location.location_notes"
                errorMessage={errors.location?.location_notes?.message}
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="h2">Well</Typography>
            </Grid>
            <Grid container spacing={2} direction={{ xs: "column", sm: "row" }}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                {/* All the statuses are from end point show user the meaning and send the backend the list of codes */}
                {/* This should be a dropdown multi select */}
                <ControlledTextField
                  label="Monitoring status"
                  fullWidth
                  control={control}
                  type="text"
                  name="well.monitoring_status"
                />
              </Grid>{" "}
              {/* altitude (let users enter in whatever units they want but always return the back in feet) */}
            </Grid>{" "}
            <Grid
              container
              size={12}
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
              sx={{ paddingTop: "3rem", paddingBottom: "1rem" }}
            >
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => reset()}
                >
                  Reset
                </Button>
              </Grid>{" "}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
                <Button type="submit" variant="contained" fullWidth>
                  Submit
                </Button>
              </Grid>{" "}
            </Grid>{" "}
          </Grid>{" "}
        </Box>
      </CardContent>
    </Card>
  );
};
