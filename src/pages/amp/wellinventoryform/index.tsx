import { Dispatch, SetStateAction, useState } from "react";
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
  IconButton,
  Select,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  ControlledEmailField,
  ControlledSelectField,
  ControlledTextField,
  ControlledCheckbox,
  ControlledOSMAddressAutocomplete,
  ControlledPhoneField,
} from "@/components";
import { useTheme } from "@mui/material";
import { PersonSearch } from "@mui/icons-material";
import { SearchOwnerDialog } from "./SearchOwnerDialog";
import {
  getAltitudeDatums,
  getAltitudeMethods,
  getCoordinateDatums,
  getFormations,
  getMonitoringStatuses,
  getProjects,
  getSiteTypes,
} from "./well_inventory.service";

export const WellInventoryForm = () => {
  const theme = useTheme();

  const [openSearchOwnerDialog, setOpenSearchOwnerDialog] = useState(false);

  const [_, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NM");
  const [zip, setZip] = useState("");

  const [coordinateType, setCoordinateType] = useState("utm");

  const {
    refineCore: { onFinish },
    formState: { errors },
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm<IWellInventoryForm>({
    defaultValues: SchemaDefaults,
    resolver: yupResolver(WellInventorySchema),
    mode: "onTouched",
  });

  const handleReset = () => {
    // reset the useForm state
    reset(SchemaDefaults);

    // reset local useState state
    setAddress(SchemaDefaults.owner.physical_address);
    setCity(SchemaDefaults.owner.physical_city);
    setState(SchemaDefaults.owner.physical_state);
    setZip(SchemaDefaults.owner.physical_zip_code);
    setCoordinateType(SchemaDefaults.location.coordinates.type);
    setSelectedProject(SchemaDefaults.project.project);
  };

  const handleOnChange = <T,>(
    newValue: T,
    setState: Dispatch<SetStateAction<T>>,
    formFieldName: string,
  ) => {
    setState(newValue);
    setValue(formFieldName, newValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const locationLabels = {
    utm: ["Easting", "Northing"],
    gcs: ["Longitude", "Latitude"],
  };

  const {
    data: coordinateDatums,
    isFetching: isCoordinateDatumFetching,
    isError: isCoordinateDatumError,
  } = getCoordinateDatums();

  const {
    data: altitudeDatums,
    isFetching: isAltitudeDatumFetching,
    isError: isAltitudeDatumError,
  } = getAltitudeDatums();

  const {
    data: altitudeMethods,
    isFetching: isAltitudeMethodFetching,
    isError: isAltitudeMethodError,
  } = getAltitudeMethods();

  const {
    data: formations,
    isFetching: isFormationFetching,
    isError: isFormationError,
  } = getFormations();

  const {
    data: monitoryingStatuses,
    isFetching: isMonitoryingStatusFetching,
    isError: isMonitoryingStatusError,
  } = getMonitoringStatuses();

  const {
    data: projects,
    isFetching: isProjectFetching,
    isError: isProjectError,
  } = getProjects();

  const {
    data: siteTypes,
    isFetching: isSiteTypeFetching,
    isError: isSiteTypeError,
  } = getSiteTypes();

  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectData = projects?.find(
    (proj) => proj.Project === selectedProject,
  );

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
                {isProjectFetching ? (
                  <Skeleton variant="rectangular" width="100%" height={55}>
                    <Select fullWidth />
                  </Skeleton>
                ) : (
                  <ControlledSelectField
                    label="Project Name"
                    control={control}
                    name="project.project"
                    value={selectedProject}
                    disabled={isProjectError}
                    onChange={(e) => {
                      handleOnChange(
                        e.target.value,
                        setSelectedProject,
                        "project.project",
                      );
                      reset({ "project.pointid_prefix": "" });
                    }}
                    options={projects.map((option) => {
                      return { value: option.Project, label: option.Project };
                    })}
                    errorMessage={errors.project?.project?.message}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                {isProjectFetching ? (
                  <Skeleton variant="rectangular" width="100%" height={55}>
                    <Select fullWidth />
                  </Skeleton>
                ) : (
                  <ControlledSelectField
                    label="PointId Prefix"
                    control={control}
                    disabled={!selectedProjectData || isProjectError}
                    name="project.pointid_prefix"
                    options={
                      selectedProjectData
                        ? selectedProjectData.PointIDPrefix.map((prefix) => ({
                            value: prefix,
                            label: prefix,
                          }))
                        : []
                    }
                    errorMessage={errors.project?.pointid_prefix?.message}
                  />
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2} direction={{ xs: "column", sm: "row" }}>
              <Grid container size={12} alignItems="center" direction="row">
                <Typography variant="h2" sx={{ width: "fit-content" }}>
                  Owner
                </Typography>
                <Tooltip title="Search for owner" placement="right">
                  <IconButton
                    onClick={() => setOpenSearchOwnerDialog(true)}
                    color="primary"
                    aria-label="Search for owner button"
                  >
                    <PersonSearch />
                  </IconButton>
                </Tooltip>
                <SearchOwnerDialog
                  open={openSearchOwnerDialog}
                  setOpen={setOpenSearchOwnerDialog}
                />
              </Grid>
              <Grid size={12}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
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
                  label="City"
                  value={city}
                  onChange={(e) =>
                    handleOnChange(
                      e.target.value,
                      setCity,
                      "owner.physical_city",
                    )
                  }
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.physical_city"
                  errorMessage={errors.owner?.physical_city?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <ControlledTextField
                  label="State"
                  value={state}
                  onChange={(e) =>
                    handleOnChange(
                      e.target.value.toLocaleUpperCase(),
                      setState,
                      "owner.physical_state",
                    )
                  }
                  fullWidth
                  type="text"
                  control={control}
                  name="owner.physical_state"
                  errorMessage={errors.owner?.physical_state?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <ControlledTextField
                  label="Zip Code"
                  value={zip}
                  onChange={(e) =>
                    handleOnChange(
                      e.target.value,
                      setZip,
                      "owner.physical_zip_code",
                    )
                  }
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
                control={control}
                name="location.site_name"
                errorMessage={errors.location?.site_name?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 5 }}>
              <ControlledTextField
                label={locationLabels[coordinateType][0]}
                fullWidth
                control={control}
                name="location.coordinates.x"
                errorMessage={errors.location?.coordinates?.x?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 5 }}>
              <ControlledTextField
                label={locationLabels[coordinateType][1]}
                fullWidth
                control={control}
                name="location.coordinates.y"
                errorMessage={errors.location?.coordinates?.y?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4, lg: 2 }}>
              <ControlledSelectField
                label="Coordinate Type"
                control={control}
                name="location.coordinates.type"
                value={coordinateType}
                onChange={(e) =>
                  handleOnChange(
                    e.target.value,
                    setCoordinateType,
                    "location.coordinates.type",
                  )
                }
                options={[
                  { value: "gcs", label: "GCS" },
                  { value: "utm", label: "UTM" },
                ]}
                errorMessage={errors.location?.coordinates?.type?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ControlledTextField
                label="Altitude"
                control={control}
                name="location.altitude"
                errorMessage={errors.location?.altitude?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {isCoordinateDatumFetching ? (
                <Skeleton variant="rectangular" width="100%" height={55}>
                  <Select fullWidth />
                </Skeleton>
              ) : (
                <ControlledSelectField
                  label="UTM Datum"
                  control={control}
                  name="location.utm_datum"
                  disabled={isCoordinateDatumError}
                  options={coordinateDatums.map((option) => {
                    return { value: option.DATUMCODE, label: option.DATUMCODE };
                  })}
                  errorMessage={errors.location?.utm_datum?.message}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {isAltitudeDatumFetching ? (
                <Skeleton variant="rectangular" width="100%" height={55}>
                  <Select fullWidth />
                </Skeleton>
              ) : (
                <ControlledSelectField
                  label="ALT Datum"
                  control={control}
                  name="location.alt_datum"
                  disabled={isAltitudeDatumError}
                  options={altitudeDatums.map((option) => {
                    return { value: option.Code, label: option.Code };
                  })}
                  errorMessage={errors.location?.alt_datum?.message}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {isAltitudeMethodFetching ? (
                <Skeleton variant="rectangular" width="100%" height={55}>
                  <Select fullWidth />
                </Skeleton>
              ) : (
                <ControlledSelectField
                  label="Altitude Method"
                  control={control}
                  name="location.altitude_method"
                  disabled={isAltitudeMethodError}
                  options={altitudeMethods.map((option) => {
                    return { value: option.Code, label: option.Meaning };
                  })}
                  errorMessage={errors.location?.altitude_method?.message}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              {isSiteTypeFetching ? (
                <Skeleton variant="rectangular" width="100%" height={55}>
                  <Select fullWidth />
                </Skeleton>
              ) : (
                <ControlledSelectField
                  label="Site Type"
                  control={control}
                  name="location.site_type"
                  disabled={isSiteTypeError}
                  options={siteTypes.map((option) => {
                    return { value: option.Code, label: option.Meaning };
                  })}
                  errorMessage={errors.location?.site_type?.message}
                />
              )}
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
              <ControlledCheckbox
                label="Owner acknowledges data will be publicly available?"
                control={control}
                name="location.public_release"
                errorMessage={errors.location?.public_release?.message}
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="h2">Well</Typography>
            </Grid>
            <Grid container spacing={2} direction={{ xs: "column", sm: "row" }}>
              <Grid size={12}>
                <ControlledCheckbox
                  label="Would owner give permission for repeat measurements?"
                  control={control}
                  name="location.monitor_ok"
                  errorMessage={errors.location?.monitor_ok?.message}
                />
              </Grid>
              <Grid size={12}>
                <ControlledCheckbox
                  label="Would owner give permission for sampling in the future?"
                  control={control}
                  name="location.sample_ok"
                  errorMessage={errors.location?.sample_ok?.message}
                />
              </Grid>
              <Grid size={12}>
                <ControlledCheckbox
                  label="Would owner give permission for datalogger installation?"
                  control={control}
                  name="location.open_well_logger_ok"
                  errorMessage={errors.location?.open_well_logger_ok?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  label="OSE Well Record"
                  fullWidth
                  control={control}
                  name="well.ose_well_id"
                  errorMessage={errors.well?.ose_well_id?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <ControlledTextField
                  label="Well Total Depth"
                  fullWidth
                  control={control}
                  name="well.hole_depth"
                  errorMessage={errors.well?.hole_depth?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <ControlledTextField
                  label="Outer Casing Diameter"
                  fullWidth
                  control={control}
                  name="well.casing_diameter"
                  errorMessage={errors.well?.casing_diameter?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <ControlledTextField
                  label="Casing Depth"
                  fullWidth
                  control={control}
                  name="well.casing_depth"
                  errorMessage={errors.well?.casing_depth?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <ControlledTextField
                  label="MP Height (+/-)"
                  fullWidth
                  control={control}
                  name="well.mp_height"
                  errorMessage={errors.well?.mp_height?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <ControlledTextField
                  label="MP Description"
                  fullWidth
                  control={control}
                  name="well.measuring_point"
                  errorMessage={errors.well?.measuring_point?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                {isMonitoryingStatusFetching ? (
                  <Skeleton variant="rectangular" width="100%" height={55}>
                    <Select fullWidth />
                  </Skeleton>
                ) : (
                  <ControlledSelectField
                    label="Monitoring status"
                    fullWidth
                    control={control}
                    name="well.monitoring_status"
                    disabled={isMonitoryingStatusError}
                    options={monitoryingStatuses.map((option) => {
                      return {
                        label: option.Meaning,
                        value: option.Code,
                      };
                    })}
                    errorMessage={errors.well?.monitoring_status?.message}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                {isFormationFetching ? (
                  <Skeleton variant="rectangular" width="100%" height={55}>
                    <Select fullWidth />
                  </Skeleton>
                ) : (
                  <ControlledSelectField
                    label="Formation"
                    control={control}
                    name="well.formation"
                    disabled={isFormationError}
                    options={formations.map((option) => {
                      return { value: option.Code, label: option.Meaning };
                    })}
                    errorMessage={errors.well?.formation?.message}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <ControlledTextField
                  label="Static Water"
                  fullWidth
                  control={control}
                  name="well.static_water"
                  errorMessage={errors.well?.static_water?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  label="Data Source"
                  fullWidth
                  control={control}
                  name="well.data_source"
                  errorMessage={errors.well?.data_source?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  multiline
                  label="Casing Description"
                  fullWidth
                  control={control}
                  name="well.casing_description"
                  errorMessage={errors.well?.casing_description?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  multiline
                  label="Construction Notes"
                  fullWidth
                  control={control}
                  name="well.construction_notes"
                  errorMessage={errors.well?.construction_notes?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  multiline
                  label="Water Notes"
                  fullWidth
                  control={control}
                  name="well.water_notes"
                  errorMessage={errors.well?.water_notes?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  multiline
                  label="Status Notes"
                  fullWidth
                  control={control}
                  name="well.status_user_notes"
                  errorMessage={errors.well?.status_user_notes?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ControlledTextField
                  multiline
                  label="Notes"
                  fullWidth
                  control={control}
                  name="well.notes"
                  errorMessage={errors.well?.notes?.message}
                />
              </Grid>
            </Grid>
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
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Grid>{" "}
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
                <Button type="submit" variant="contained" fullWidth>
                  Submit
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};
