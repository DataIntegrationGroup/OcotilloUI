import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Map, Marker } from "react-map-gl";
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
  Paper,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  ControlledEmailField,
  ControlledSelectField,
  ControlledTextField,
  ControlledCheckbox,
  ControlledMapboxAddressAutocomplete,
  ControlledPhoneField,
} from "@/components";
import { useTheme } from "@mui/material";
import { PersonSearch } from "@mui/icons-material";
import {
  LoadingControlledSelectField,
  SearchOwnerDialog,
  NewPointIdPreview,
} from "@/components/amp/wellinventoryform";
import {
  createWellInventoryForm,
  getAltitudeDatums,
  getAltitudeMethods,
  getCoordinateDatums,
  getFormations,
  getMonitoringStatuses,
  getNewPointIDPreview,
  getProjects,
  getSiteTypes,
} from "./well_inventory.service";
import { locationLabels } from "./well_inventory.configs";
import { SkeletonFormField } from "@/components/SkeletonFormField";
import { ErrorAlertFormField } from "@/components/ErrorAlertFormField";
import { useMutation } from "@tanstack/react-query";
import { useNotification } from "@refinedev/core";
import { settings } from "@/settings";
import { ColorModeContext } from "@/contexts";
import { convertLonLatToUTM, convertUTMToLonLat } from "@/utils/UtmToLonLat";

export const WellInventoryForm = () => {
  const mapRef = useRef(null);
  const initialViewState = {
    longitude: -106.4,
    latitude: 34.5,
    zoom: 6,
  };

  const [viewState, setViewState] = useState(initialViewState);

  const style = { width: "100%", height: "650px" };
  const { mode } = useContext(ColorModeContext);
  const mapStyle =
    mode === "dark"
      ? "mapbox://styles/mapbox/dark-v10"
      : "mapbox://styles/mapbox/light-v10";

  const theme = useTheme();

  const [openSearchOwnerDialog, setOpenSearchOwnerDialog] = useState(false);

  const [_, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NM");
  const [zip, setZip] = useState("");

  const [coordinateType, setCoordinateType] = useState("utm");

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPointIDPrefix, setSelectedPointIDPrefix] = useState("");

  const { control, handleSubmit, reset, setValue, watch, setError } =
    useForm<IWellInventoryForm>({
      defaultValues: SchemaDefaults,
      resolver: yupResolver(WellInventorySchema),
    });

  const x = watch("location.coordinates.x");
  const y = watch("location.coordinates.y");
  const utmZone = watch("location.utm_zone");

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
    setSelectedPointIDPrefix(SchemaDefaults.project.pointid_prefix);
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

  const handleCoordinateTypeChange = (newType: "utm" | "gcs") => {
    const currentX = watch("location.coordinates.x");
    const currentY = watch("location.coordinates.y");

    if (
      typeof currentX === "number" &&
      typeof currentY === "number" &&
      !isNaN(currentX) &&
      !isNaN(currentY)
    ) {
      let newX = currentX;
      let newY = currentY;

      if (coordinateType === "utm" && newType === "gcs") {
        // Convert UTM → GCS
        [newX, newY] = convertUTMToLonLat(currentX, currentY, utmZone);
      } else if (coordinateType === "gcs" && newType === "utm") {
        // Convert GCS → UTM
        [newX, newY] = convertLonLatToUTM(currentX, currentY, utmZone);
      }

      // Set new values in the form
      setValue("location.coordinates.x", newX, {
        shouldValidate: true,
        shouldDirty: true,
      });

      setValue("location.coordinates.y", newY, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    setCoordinateType(newType);
    setValue("location.coordinates.type", newType, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const updateMapView = (longitude: number, latitude: number) => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [longitude, latitude],
        zoom: viewState.zoom,
        duration: 1500,
        easing: (t: number) => t * (2 - t), // Smooth easing function
      });
    }
  };

  const handleCoordinateValidation = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    formFieldName: "location.coordinates.x" | "location.coordinates.y",
  ) => {
    const inputValue = e.target.value.trim();
    let newValue = parseFloat(inputValue);

    console.log("inputValue:", inputValue);
    console.log("formFieldName:", formFieldName);

    if (isNaN(newValue) || inputValue === "") {
      setError(formFieldName, {
        type: "manual",
        message: `${
          coordinateType === "gcs"
            ? formFieldName === "location.coordinates.x"
              ? "Longitude"
              : "Latitude"
            : formFieldName === "location.coordinates.x"
              ? "UTM X"
              : "UTM Y"
        } must be a valid number.`,
      });

      console.log("empty or Nan:", inputValue);
      setValue(formFieldName, inputValue, {
        shouldValidate: false,
        shouldDirty: true,
      });
      return;
    }

    if (coordinateType === "gcs") {
      if (
        formFieldName === "location.coordinates.x" &&
        (newValue < -180 || newValue > 180)
      ) {
        console.log("long too long:", inputValue);
        setError(formFieldName, {
          type: "manual",
          message: "Longitude must be between -180 and 180.",
        });
        setValue(formFieldName, inputValue, {
          shouldValidate: false,
          shouldDirty: true,
        });
        return;
      }

      if (
        formFieldName === "location.coordinates.y" &&
        (newValue < -90 || newValue > 90)
      ) {
        console.log("lat too lat:", inputValue);
        setError(formFieldName, {
          type: "manual",
          message: "Latitude must be between -90 and 90.",
        });
        setValue(formFieldName, inputValue, {
          shouldValidate: false,
          shouldDirty: true,
        });
        return;
      }
    }

    setValue(formFieldName, newValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCoordinateUpdate = () => {
    const currentX = parseFloat(watch("location.coordinates.x"));
    const currentY = parseFloat(watch("location.coordinates.y"));

    if (
      typeof currentX === "number" &&
      typeof currentY === "number" &&
      !isNaN(currentX) &&
      !isNaN(currentY)
    ) {
      let longitude = currentX;
      let latitude = currentY;

      if (coordinateType === "utm" && utmZone) {
        [longitude, latitude] = convertUTMToLonLat(currentX, currentY, utmZone);
      }

      if (
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      )
        return;

      updateMapView(longitude, latitude);
    }
  };

  const {
    data: coordinateDatums,
    isPending: isCoordinateDatumFetching,
    isError: isCoordinateDatumError,
  } = getCoordinateDatums();

  const {
    data: altitudeDatums,
    isPending: isAltitudeDatumFetching,
    isError: isAltitudeDatumError,
  } = getAltitudeDatums();

  const {
    data: altitudeMethods,
    isPending: isAltitudeMethodFetching,
    isError: isAltitudeMethodError,
  } = getAltitudeMethods();

  const {
    data: formations,
    isPending: isFormationFetching,
    isError: isFormationError,
  } = getFormations();

  const {
    data: monitoryingStatuses,
    isPending: isMonitoryingStatusFetching,
    isError: isMonitoryingStatusError,
  } = getMonitoringStatuses();

  const {
    data: projects,
    isPending: isProjectFetching,
    isError: isProjectError,
  } = getProjects();

  const selectedProjectData = useMemo(
    () => projects?.find((proj) => proj.Project === selectedProject),
    [projects, selectedProject],
  );

  const {
    data: siteTypes,
    isPending: isSiteTypeFetching,
    isError: isSiteTypeError,
  } = getSiteTypes();

  const {
    data: newPointIdPreview,
    isFetching: isNewPointIdPreviewFetching,
    isError: isNewPointIdPreviewError,
    refetch: refetchNewPointIdPreview,
  } = getNewPointIDPreview(selectedPointIDPrefix);

  useEffect(() => {
    if (selectedPointIDPrefix) {
      refetchNewPointIdPreview();
    }
  }, [selectedPointIDPrefix, refetchNewPointIdPreview]);

  const { open, close } = useNotification();

  const { mutateAsync, isPending: isFormSubmissionPending } = useMutation({
    mutationFn: createWellInventoryForm,
    onMutate: () => {
      open?.({
        key: "well-inventory-submission",
        type: "progress",
        message: "Submitting Well Inventory Form...",
      });
    },
    onSuccess: () => {
      close?.("well-inventory-submission");
      open?.({
        type: "success",
        message: "Form Submitted Successfully!",
        description: "Your well inventory form has been submitted.",
      });
    },
    onError: () => {
      close?.("well-inventory-submission");
      open?.({
        type: "error",
        message: "Failed to Submit Form",
        description: "Please check your input and try again later.",
      });
    },
  });

  const handleFormSubmit = async (data: Partial<IWellInventoryForm>) => {
    try {
      await mutateAsync(data);
      reset();
    } catch (err) {
      console.error("Form submission error:", err);
    }
  };

  return (
    <>
      <Card>
        <CardHeader title="Well Inventory Form" />
        <CardContent sx={{ padding: "2.5rem" }}>
          <Box
            component="form"
            autoComplete="off"
            onSubmit={handleSubmit(handleFormSubmit)}
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
                  <LoadingControlledSelectField
                    required
                    isLoading={isProjectFetching}
                    isError={isProjectError}
                    errorMessage="Failed to load Projects"
                    label="Project Name"
                    control={control}
                    name="project.project"
                    value={selectedProject}
                    disabled={isProjectError}
                    onChange={(
                      e: SelectChangeEvent<HTMLSelectElement>,
                      _: React.ReactNode,
                    ) => {
                      handleOnChange(
                        e.target.value,
                        setSelectedProject,
                        "project.project",
                      );
                      setSelectedPointIDPrefix("");
                    }}
                    options={projects?.map((option) => {
                      return { value: option.Project, label: option.Project };
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <Tooltip
                    placement="top"
                    title={
                      !selectedProject
                        ? "Must select a Project before selecting a PointId Prefix"
                        : null
                    }
                  >
                    <div>
                      <LoadingControlledSelectField
                        required
                        isLoading={isProjectFetching}
                        label="PointId Prefix"
                        control={control}
                        disabled={!selectedProjectData || isProjectError}
                        name="project.pointid_prefix"
                        value={selectedPointIDPrefix}
                        isError={isProjectError}
                        errorMessage="Failed to load pointId prefixes"
                        onChange={(
                          e: SelectChangeEvent<HTMLSelectElement>,
                          _: React.ReactNode,
                        ) => {
                          handleOnChange(
                            e.target.value,
                            setSelectedPointIDPrefix,
                            "project.pointid_prefix",
                          );
                        }}
                        options={
                          selectedProjectData
                            ? selectedProjectData.PointIDPrefix.map(
                                (prefix) => ({
                                  value: prefix,
                                  label: prefix,
                                }),
                              )
                            : []
                        }
                      />
                    </div>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, lg: 6, xl: 3 }}>
                  {isNewPointIdPreviewFetching ? (
                    <SkeletonFormField />
                  ) : isNewPointIdPreviewError ? (
                    <ErrorAlertFormField message="Failed to load Point ID Preview" />
                  ) : (
                    <NewPointIdPreview id={newPointIdPreview} />
                  )}
                </Grid>
              </Grid>
              <Grid
                container
                spacing={2}
                direction={{ xs: "column", sm: "row" }}
              >
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
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <ControlledTextField
                    label="Last Name"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.last_name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <ControlledTextField
                    label="First Name (Secondary)"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.second_first_name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <ControlledTextField
                    label="Last Name (Secondary)"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.second_last_name"
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
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <ControlledPhoneField
                      label="Home Phone"
                      fullWidth
                      control={control}
                      type="tel"
                      name="owner.phone"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <ControlledEmailField
                      label="Email"
                      control={control}
                      name="owner.email"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, lg: 6, xl: 3 }} offset={{ xl: 3 }}>
                    <ControlledPhoneField
                      label="Phone (Secondary)"
                      control={control}
                      name="owner.second_ctct_phone"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <ControlledEmailField
                      label="Email (Secondary)"
                      control={control}
                      name="owner.second_ctct_email"
                    />
                  </Grid>
                </Grid>
                <Grid size={12}>
                  <Typography variant="h4">Physical</Typography>
                </Grid>
                <Grid size={12}>
                  <ControlledMapboxAddressAutocomplete
                    label="Address"
                    fullWidth
                    control={control}
                    name="owner.physical_address"
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
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <ControlledTextField
                    label="City"
                    fullWidth
                    type="text"
                    control={control}
                    name="owner.mail_city"
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <ControlledTextField
                    label="State"
                    fullWidth
                    type="text"
                    control={control}
                    name="owner.mail_state"
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 3 }}>
                  <ControlledTextField
                    label="Zip Code"
                    fullWidth
                    type="text"
                    control={control}
                    name="owner.mail_zip_code"
                  />
                </Grid>
              </Grid>
              <Grid size={12}>
                <Typography variant="h2">Location</Typography>
              </Grid>
              <Grid size={12}>
                <Paper elevation={2}>
                  <Map
                    {...viewState}
                    ref={mapRef}
                    onMove={(evt) => setViewState(evt.viewState)}
                    mapboxAccessToken={settings.mapboxToken}
                    initialViewState={initialViewState}
                    terrain={{ source: "mapbox-dem", exaggeration: 3 }}
                    style={style}
                    mapStyle={mapStyle}
                  >
                    {typeof x === "number" &&
                      typeof y === "number" &&
                      !isNaN(x) &&
                      !isNaN(y) && (
                        <Marker
                          {...(() => {
                            if (coordinateType === "utm" && utmZone) {
                              const [lon, lat] = convertUTMToLonLat(
                                x,
                                y,
                                utmZone,
                              );
                              return { longitude: lon, latitude: lat };
                            } else if (coordinateType === "gcs") {
                              const [longitude, latitude] = [x, y];
                              if (
                                longitude < -180 ||
                                longitude > 180 ||
                                latitude < -90 ||
                                latitude > 90
                              ) {
                                console.error("Invalid GCS coordinates:", {
                                  longitude,
                                  latitude,
                                });
                                return {
                                  longitude: undefined,
                                  latitude: undefined,
                                };
                              }
                            }
                            return { longitude: x, latitude: y };
                          })()}
                          anchor="bottom"
                        >
                          <div
                            style={{
                              width: 15,
                              height: 15,
                              borderRadius: "50%",
                              backgroundColor: "red",
                              border: "2px solid white",
                            }}
                          />
                        </Marker>
                      )}
                  </Map>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ControlledTextField
                  label="Site ID"
                  fullWidth
                  control={control}
                  name="location.site_id"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ControlledTextField
                  label="Site ID (Alternate)"
                  fullWidth
                  control={control}
                  name="location.alternate_site_id"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ControlledTextField
                  label="Site Name"
                  fullWidth
                  control={control}
                  name="location.site_name"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 5 }}>
                <ControlledTextField
                  required
                  type="number"
                  label={locationLabels[coordinateType][0]}
                  fullWidth
                  control={control}
                  name="location.coordinates.x"
                  onChange={(e) =>
                    handleCoordinateValidation(e, "location.coordinates.x")
                  }
                  onBlur={handleCoordinateUpdate}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 5 }}>
                <ControlledTextField
                  required
                  type="number"
                  label={locationLabels[coordinateType][1]}
                  fullWidth
                  control={control}
                  name="location.coordinates.y"
                  onChange={(e) =>
                    handleCoordinateValidation(e, "location.coordinates.y")
                  }
                  onBlur={handleCoordinateUpdate}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 2 }}>
                <ControlledSelectField
                  label="Coordinate Type"
                  control={control}
                  name="location.coordinates.type"
                  value={coordinateType}
                  onChange={(e) =>
                    handleCoordinateTypeChange(e.target.value as "utm" | "gcs")
                  }
                  options={[
                    { value: "gcs", label: "GCS" },
                    { value: "utm", label: "UTM" },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <ControlledTextField
                  type="number"
                  label="Altitude"
                  control={control}
                  name="location.altitude"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <ControlledTextField
                  type="number"
                  label="UTM zone"
                  control={control}
                  name="location.utm_zone"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <LoadingControlledSelectField
                  required
                  isLoading={isCoordinateDatumFetching}
                  label="UTM Datum"
                  control={control}
                  name="location.utm_datum"
                  disabled={isCoordinateDatumError}
                  isError={isCoordinateDatumError}
                  errorMessage="Failed to load UTM datums"
                  options={coordinateDatums?.map((option) => {
                    return { value: option.DATUMCODE, label: option.DATUMCODE };
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <LoadingControlledSelectField
                  isLoading={isAltitudeDatumFetching}
                  label="ALT Datum"
                  control={control}
                  name="location.alt_datum"
                  disabled={isAltitudeDatumError}
                  isError={isAltitudeDatumError}
                  errorMessage="Failed to load ALT datums"
                  options={altitudeDatums?.map((option) => {
                    return { value: option.Code, label: option.Code };
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <LoadingControlledSelectField
                  isLoading={isAltitudeMethodFetching}
                  label="Altitude Method"
                  control={control}
                  name="location.altitude_method"
                  disabled={isAltitudeMethodError}
                  isError={isAltitudeMethodError}
                  errorMessage="Failed to load altitude methods"
                  options={altitudeMethods?.map((option) => {
                    return { value: option.Code, label: option.Meaning };
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <LoadingControlledSelectField
                  isLoading={isSiteTypeFetching}
                  label="Site Type"
                  control={control}
                  name="location.site_type"
                  disabled={true}
                  isError={isSiteTypeError}
                  errorMessage="Failed to load site types"
                  options={siteTypes?.map((option) => {
                    return { value: option.Code, label: option.Meaning };
                  })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ControlledTextField
                  multiline
                  label="Notes"
                  control={control}
                  name="location.location_notes"
                />
              </Grid>
              <Grid size={12}>
                <ControlledCheckbox
                  label="Owner acknowledges data will be publicly available?"
                  control={control}
                  name="location.public_release"
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="h2">Well</Typography>
              </Grid>
              <Grid
                container
                spacing={2}
                direction={{ xs: "column", sm: "row" }}
              >
                <Grid size={12}>
                  <ControlledCheckbox
                    label="Would owner give permission for repeat measurements?"
                    control={control}
                    name="well.monitor_ok"
                  />
                </Grid>
                <Grid size={12}>
                  <ControlledCheckbox
                    label="Would owner give permission for sampling in the future?"
                    control={control}
                    name="well.sample_ok"
                  />
                </Grid>
                <Grid size={12}>
                  <ControlledCheckbox
                    label="Would owner give permission for datalogger installation?"
                    control={control}
                    name="well.open_well_logger_ok"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    label="OSE Well Record"
                    fullWidth
                    control={control}
                    name="well.ose_well_id"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="Well Total Depth"
                    fullWidth
                    control={control}
                    name="well.hole_depth"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="Outer Casing Diameter"
                    fullWidth
                    control={control}
                    name="well.casing_diameter"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="Casing Depth"
                    fullWidth
                    control={control}
                    name="well.casing_depth"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="MP Height (+/-)"
                    fullWidth
                    control={control}
                    name="well.mp_height"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <ControlledTextField
                    label="MP Description"
                    fullWidth
                    control={control}
                    name="well.measuring_point"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <LoadingControlledSelectField
                    isLoading={isMonitoryingStatusFetching}
                    label="Monitoring status"
                    fullWidth
                    control={control}
                    name="well.monitoring_status"
                    disabled={isMonitoryingStatusError}
                    isError={isMonitoryingStatusError}
                    errorMessage="Failed to load monitoring statuses"
                    options={monitoryingStatuses?.map((option) => {
                      return {
                        label: option.Meaning,
                        value: option.Code,
                      };
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <LoadingControlledSelectField
                    isLoading={isFormationFetching}
                    label="Formation"
                    control={control}
                    name="well.formation"
                    disabled={isFormationError}
                    isError={isFormationError}
                    errorMessage="Failed to load formations"
                    options={formations?.map((option) => {
                      return { value: option.Code, label: option.Meaning };
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="Static Water"
                    fullWidth
                    control={control}
                    name="well.static_water"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    label="Data Source"
                    fullWidth
                    control={control}
                    name="well.data_source"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    multiline
                    label="Casing Description"
                    fullWidth
                    control={control}
                    name="well.casing_description"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    multiline
                    label="Construction Notes"
                    fullWidth
                    control={control}
                    name="well.construction_notes"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    multiline
                    label="Water Notes"
                    fullWidth
                    control={control}
                    name="well.water_notes"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    multiline
                    label="Status Notes"
                    fullWidth
                    control={control}
                    name="well.status_user_notes"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    multiline
                    label="Notes"
                    fullWidth
                    control={control}
                    name="well.notes"
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
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isFormSubmissionPending}
                  >
                    {isFormSubmissionPending ? "Submitting..." : "Submit"}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
      <SearchOwnerDialog
        open={openSearchOwnerDialog}
        setOpen={setOpenSearchOwnerDialog}
        onOwnerSelect={(owner) => {
          setValue("owner.owner_key", owner.OwnerKey);
          setValue("owner.first_name", owner.FirstName);
          setValue("owner.last_name", owner.LastName);
          setValue("owner.email", owner.Email);
          setValue("owner.phone", owner.Phone);
          setValue("owner.cell_phone", owner.CellPhone);
        }}
      />
    </>
  );
};
