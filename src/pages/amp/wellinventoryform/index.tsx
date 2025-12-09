import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, NavigationControl } from 'react-map-gl'
import { useForm } from '@refinedev/react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { IWellInventoryForm } from '@/interfaces/amp'
import { yupResolver } from '@hookform/resolvers/yup'
import { WellInventorySchema, SchemaDefaults } from './well_inventory.schema'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormHelperText,
  IconButton,
  InputAdornment,
  Paper,
  SelectChangeEvent,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import {
  ControlledEmailField,
  ControlledSelectField,
  ControlledTextField,
  ControlledCheckbox,
  ControlledMapboxAddressAutocomplete,
  ControlledPhoneField,
  FileSelectionSection,
} from '@/components'
import { useTheme } from '@mui/material'
import { Add, Delete, PersonSearch, Refresh } from '@mui/icons-material'
import {
  LoadingControlledSelectField,
  LoadingControlledSelectWithChips,
  SearchOwnerDialog,
} from '@/components/amp/wellinventoryform'
import {
  createWellInventoryForm,
  getNewPointIDPreview,
  getElevationByDEM,
} from './well_inventory.service'
import { useGetWellInventoryLookupTablesData } from './well_inventory.hooks'
import { locationLabels } from './well_inventory.configs'
import { SkeletonFormField } from '@/components/SkeletonFormField'
import { useMutation } from '@tanstack/react-query'
import { useNotification } from '@refinedev/core'
import { settings } from '@/settings'
import { ColorModeContext } from '@/contexts'
import {
  convertLonLatToUTM,
  convertUTMToLonLat,
  fallbackWithDefault,
  getFieldPathsFromLoc,
  updateMapView,
} from '@/utils'
import { ControlledDateField } from '@/components/Controlled/ControlledDateField'
import { FetchValidationError } from '@/interfaces'

export const WellInventoryForm = () => {
  const theme = useTheme()
  const mapRef = useRef(null)
  const initialViewState = {
    longitude: -106.4,
    latitude: 34.5,
    zoom: 6,
  }

  const supportedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/heic',
    'application/pdf',
    '.gpx',
  ]

  const [viewState, setViewState] = useState(initialViewState)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [noteAppended, setNoteAppended] = useState(false)
  const [openSearchOwnerDialog, setOpenSearchOwnerDialog] = useState(false)

  const [casingWarning, setCasingWarning] = useState<string | null>(null)

  const style = { width: '100%', height: '650px' }
  const { mode } = useContext(ColorModeContext)
  const mapStyle = (zoom: number) =>
    zoom > 10
      ? 'mapbox://styles/mapbox/satellite-streets-v11'
      : mode === 'dark'
        ? 'mapbox://styles/mapbox/dark-v10'
        : 'mapbox://styles/mapbox/light-v10'

  const { control, handleSubmit, reset, setValue, watch, setError } =
    useForm<IWellInventoryForm>({
      defaultValues: SchemaDefaults,
      resolver: yupResolver(WellInventorySchema as any),
    })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'well_screens',
  })

  const { project: selectedProject, pointid_prefix: pointIdPrefix } =
    watch('project')

  const {
    coordinates: { x, y, type: coordinateType },
    site_type: siteType,
    utm_zone: utmZone,
    elevation_method: elevationMethod,
    location_notes: existingNotes = '',
  } = watch('location')

  const { casing_diameter } = watch('well')

  useEffect(() => {
    if (casing_diameter > 3) {
      setCasingWarning('Warning: Casing diameter is greater than 3 feet.')
    } else {
      setCasingWarning(null)
    }
  }, [casing_diameter])

  const USGS_NATIONAL_ELEVATION_DATASET = 'E'
  const noteToAdd =
    'Elevation data was obtained from the National Elevation Dataset (NED) provided by the U.S. Geological Survey (USGS). You can access more information and the data via the official site: https://epqs.nationalmap.gov.'

  const [longitude, latitude] = useMemo(() => {
    if (
      coordinateType === 'utm' &&
      !isNaN(x) &&
      !isNaN(y) &&
      typeof x === 'number' &&
      typeof y === 'number'
    ) {
      return convertUTMToLonLat(x, y, utmZone)
    }
    return [x, y]
  }, [x, y, utmZone, coordinateType])

  const elevationQuery = getElevationByDEM(
    longitude,
    latitude,
    elevationMethod === USGS_NATIONAL_ELEVATION_DATASET &&
      longitude != null &&
      latitude != null
  )

  useEffect(() => {
    if (
      elevationMethod === USGS_NATIONAL_ELEVATION_DATASET &&
      elevationQuery.isSuccess &&
      elevationQuery.data
    ) {
      const elevationInFeet = Math.round(elevationQuery.data.value * 100) / 100

      handleSetValue('location.elevation', elevationInFeet)
      handleSetValue('location.elevation_accuracy', 1.74)
      handleSetValue('location.elevation_datum', 'NAVD88')

      setNoteAppended(true)
    } else if (elevationMethod !== USGS_NATIONAL_ELEVATION_DATASET) {
      setNoteAppended(false)
    }
  }, [
    elevationMethod,
    elevationQuery.isSuccess,
    elevationQuery.data,
    existingNotes,
    setValue,
    noteAppended,
  ])

  const handleReset = () => {
    reset(SchemaDefaults)
    setSelectedFiles([])
  }

  const handleSetValue = <T,>(formFieldName: string, newValue: T) => {
    setValue(formFieldName, newValue, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const handleCoordinateTypeChange = (newType: 'utm' | 'gcs') => {
    const currentX = watch('location.coordinates.x')
    const currentY = watch('location.coordinates.y')

    if (
      typeof currentX === 'number' &&
      typeof currentY === 'number' &&
      !isNaN(currentX) &&
      !isNaN(currentY)
    ) {
      let newX = currentX
      let newY = currentY

      if (coordinateType === 'utm' && newType === 'gcs') {
        // Convert UTM → GCS
        ;[newX, newY] = convertUTMToLonLat(currentX, currentY, utmZone)
      } else if (coordinateType === 'gcs' && newType === 'utm') {
        // Convert GCS → UTM
        ;({ easting: newX, northing: newY } = convertLonLatToUTM(
          { lon: currentX, lat: currentY },
          utmZone
        ))
      }

      // Set new values in the form
      handleSetValue('location.coordinates.x', newX)
      handleSetValue('location.coordinates.y', newY)
    }

    handleSetValue('location.coordinates.type', newType)
  }

  const handleCoordinateValidation = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    formFieldName: 'location.coordinates.x' | 'location.coordinates.y'
  ) => {
    const inputValue = e.target.value.trim()
    let newValue = parseFloat(inputValue)

    if (isNaN(newValue) || inputValue === '') {
      setError(formFieldName, {
        type: 'manual',
        message: `${
          coordinateType === 'gcs'
            ? formFieldName === 'location.coordinates.x'
              ? 'Longitude'
              : 'Latitude'
            : formFieldName === 'location.coordinates.x'
              ? 'UTM X'
              : 'UTM Y'
        } must be a valid number.`,
      })

      handleSetValue(formFieldName, inputValue)
      return
    }

    if (coordinateType === 'gcs') {
      if (
        formFieldName === 'location.coordinates.x' &&
        (newValue < -180 || newValue > 180)
      ) {
        setError(formFieldName, {
          type: 'manual',
          message: 'Longitude must be between -180 and 180.',
        })
        handleSetValue(formFieldName, inputValue)
        return
      }

      if (
        formFieldName === 'location.coordinates.y' &&
        (newValue < -90 || newValue > 90)
      ) {
        setError(formFieldName, {
          type: 'manual',
          message: 'Latitude must be between -90 and 90.',
        })
        handleSetValue(formFieldName, inputValue)
        return
      }
    }

    handleSetValue(formFieldName, newValue)
  }

  const handleCoordinateUpdate = () => {
    const currentX = parseFloat(x)
    const currentY = parseFloat(y)

    if (
      typeof currentX === 'number' &&
      typeof currentY === 'number' &&
      !isNaN(currentX) &&
      !isNaN(currentY)
    ) {
      let longitude = currentX
      let latitude = currentY

      if (coordinateType === 'utm' && utmZone) {
        ;[longitude, latitude] = convertUTMToLonLat(currentX, currentY, utmZone)
      }

      if (
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      )
        return

      updateMapView(mapRef.current, longitude, latitude)
    }
  }

  const {
    CoordinateAccuraciesQuery,
    CoordinateMethodsQuery,
    CoordinateDatumsQuery,
    ElevationDatumsQuery,
    ElevationMethodsQuery,
    DepthSourcesQuery,
    CompletionSourcesQuery,
    StatusQuery,
    MonitoringStatusesQuery,
    FormationsQuery,
    ConstructionMethodsQuery,
    CurrentUsesQuery,
    ProjectsQuery,
    SiteTypesQuery,
  } = useGetWellInventoryLookupTablesData()

  const selectedProjectData = useMemo(
    () => ProjectsQuery.data?.find((proj) => proj.Project === selectedProject),
    [ProjectsQuery.data, selectedProject]
  )

  const {
    data: newPointIdPreview,
    isFetching: isNewPointIdPreviewFetching,
    isError: isNewPointIdPreviewError,
    refetch: refetchNewPointIdPreview,
  } = getNewPointIDPreview(pointIdPrefix, siteType)

  useEffect(() => {
    if (pointIdPrefix) {
      refetchNewPointIdPreview()
    }
  }, [pointIdPrefix, refetchNewPointIdPreview, setValue])

  useEffect(() => {
    if (newPointIdPreview && !isNewPointIdPreviewError) {
      const newPointIdPreviewSuffix = newPointIdPreview.split('-')[1]
      handleSetValue('project.pointid_suffix', newPointIdPreviewSuffix)
    }
  }, [newPointIdPreview, isNewPointIdPreviewError, setValue])

  const { open, close } = useNotification()

  const { mutateAsync, isPending: isFormSubmissionPending } = useMutation({
    mutationFn: createWellInventoryForm,
    onMutate: () => {
      open?.({
        key: 'well-inventory-submission',
        type: 'progress',
        message: 'Submitting Well Inventory Form...',
      })
    },
    onSuccess: () => {
      close?.('well-inventory-submission')
      open?.({
        type: 'success',
        message: 'Form Submitted Successfully!',
        description: 'Your well inventory form has been submitted.',
      })
    },
    onError: () => {
      close?.('well-inventory-submission')
      open?.({
        type: 'error',
        message: 'Failed to Submit Form',
        description: 'Please check your input and try again later.',
      })
    },
  })

  const handleFormSubmit = async (data: Partial<IWellInventoryForm>) => {
    try {
      if (noteAppended) {
        // Ensure location_notes ends with a newline character
        if (!data.location.location_notes.endsWith('\n')) {
          data.location.location_notes += '\n'
        } // Append noteToAdd on a new line
        data.location.location_notes += `${noteToAdd}\n`
      }

      await mutateAsync({
        body: data,
        files: selectedFiles,
        supportedFileTypes,
      })
    } catch (err) {
      const errorWithStatus = err as FetchValidationError

      if (
        errorWithStatus.status === 422 &&
        Array.isArray(errorWithStatus.data?.detail)
      ) {
        const details = errorWithStatus.data.detail

        details.forEach((issue) => {
          const fieldPaths = getFieldPathsFromLoc(
            WellInventorySchema.describe(),
            issue.loc
          )

          if (fieldPaths.length > 0) {
            fieldPaths.forEach((path) => {
              setError(path as any, {
                type: 'server',
                message: issue.msg,
              })
            })
          } else {
            console.warn('Invalid error location received:', issue.loc)
          }
        })
      } else {
        console.error('Unexpected form error:', err)
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader title="Well Inventory Form" />
        <CardContent sx={{ padding: '2.5rem' }}>
          <Box
            component="form"
            autoComplete="off"
            onSubmit={handleSubmit(handleFormSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
          >
            <Grid
              container
              spacing={2}
              direction={{ xs: 'column', sm: 'row' }}
              sx={{
                maxWidth: theme.breakpoints.values.lg,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <Grid
                container
                sx={{ width: '100%' }}
                direction={{ xs: 'column', sm: 'row' }}
              >
                <Grid size={12}>
                  <Typography variant="h2">Project</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue(
                        'project.project',
                        SchemaDefaults.project.project
                      )
                      setValue(
                        'project.pointid_prefix',
                        SchemaDefaults.project.pointid_prefix
                      )
                      setValue(
                        'project.pointid_suffix',
                        SchemaDefaults.project.pointid_suffix
                      )
                    }}
                    isLoading={ProjectsQuery.isFetching}
                    isError={ProjectsQuery.isError}
                    errorMessage="Failed to load Projects"
                    showAsterisk={true}
                    label="Project Name"
                    title="Name of project"
                    control={control}
                    name="project.project"
                    disabled={ProjectsQuery.isError}
                    onChange={(
                      e: SelectChangeEvent<HTMLSelectElement>,
                      _: React.ReactNode
                    ) => {
                      handleSetValue('project.project', e.target.value)
                      setValue(
                        'project.pointid_prefix',
                        SchemaDefaults.project.pointid_prefix
                      )
                      setValue(
                        'project.pointid_suffix',
                        SchemaDefaults.project.pointid_suffix
                      )
                    }}
                    options={ProjectsQuery?.data
                      ?.sort((a, b) =>
                        a.Project.toLocaleLowerCase().localeCompare(
                          b.Project.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => ({
                        value: option.Project,
                        label: option.Project,
                      }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <Tooltip
                    placement="top"
                    title={
                      !selectedProject
                        ? 'Must select a Project before selecting a PointId Prefix'
                        : null
                    }
                  >
                    <div>
                      <LoadingControlledSelectField
                        resetFn={() => {
                          setValue(
                            'project.pointid_prefix',
                            SchemaDefaults.project.pointid_prefix
                          )
                          setValue(
                            'project.pointid_suffix',
                            SchemaDefaults.project.pointid_suffix
                          )
                        }}
                        showAsterisk={true}
                        isLoading={ProjectsQuery.isFetching}
                        label="PointId Prefix"
                        control={control}
                        disabled={!selectedProjectData || ProjectsQuery.isError}
                        name="project.pointid_prefix"
                        isError={ProjectsQuery.isError}
                        errorMessage="Failed to load pointId prefixes"
                        onChange={(
                          e: SelectChangeEvent<HTMLSelectElement>,
                          _: React.ReactNode
                        ) => {
                          handleSetValue(
                            'project.pointid_prefix',
                            e.target.value
                          )
                        }}
                        options={
                          selectedProjectData
                            ? // Case-insensitive sort for consistent UX
                              selectedProjectData.PointIDPrefix?.sort((a, b) =>
                                a
                                  .toLocaleLowerCase()
                                  .localeCompare(b.toLocaleLowerCase())
                              )?.map((prefix) => ({
                                value: prefix,
                                label: prefix,
                              }))
                            : []
                        }
                      />
                    </div>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue(
                        'location.site_type',
                        SchemaDefaults.location.site_type
                      )
                    }}
                    isLoading={SiteTypesQuery.isFetching}
                    label="Site Type"
                    title="Type of site/monitoring location"
                    control={control}
                    name="location.site_type"
                    disabled={true}
                    isError={SiteTypesQuery.isError}
                    errorMessage="Failed to load site types"
                    options={SiteTypesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 6, xl: 3 }}>
                  {isNewPointIdPreviewFetching ? (
                    <SkeletonFormField />
                  ) : (
                    <Tooltip placement="top" title="Point identifier or name">
                      <div>
                        <ControlledTextField
                          showAsterisk={true}
                          label="Point ID"
                          fullWidth
                          control={control}
                          type="text"
                          name="project.pointid_suffix"
                          disabled={!pointIdPrefix}
                          error={isNewPointIdPreviewError}
                          helperText={
                            isNewPointIdPreviewError
                              ? 'Failed to load Point ID Preview'
                              : undefined
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  {pointIdPrefix ? `${pointIdPrefix}-` : null}
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    disabled={!pointIdPrefix}
                                    aria-label="Re-fetch next Point ID"
                                    onClick={async () => {
                                      await refetchNewPointIdPreview()
                                      if (
                                        newPointIdPreview &&
                                        !isNewPointIdPreviewError
                                      ) {
                                        const newPointIdPreviewSuffix =
                                          newPointIdPreview.split('-')[1]
                                        handleSetValue(
                                          'project.pointid_suffix',
                                          newPointIdPreviewSuffix
                                        )
                                      }
                                    }}
                                    edge="end"
                                  >
                                    <Refresh />
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </div>
                    </Tooltip>
                  )}
                </Grid>
              </Grid>
              <Grid
                container
                spacing={2}
                direction={{ xs: 'column', sm: 'row' }}
              >
                <Grid container size={12} alignItems="center" direction="row">
                  <Typography variant="h2" sx={{ width: 'fit-content' }}>
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
                    <Tooltip
                      placement="top"
                      title="ID assigned to each owner record, usually owner’s last name, first name"
                    >
                      <ControlledTextField
                        showAsterisk={true}
                        label="Owner Key"
                        fullWidth
                        control={control}
                        type="text"
                        name="owner.owner_key"
                      />
                    </Tooltip>
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
                    marginLeft: '0rem !important',
                    marginRight: '0rem !important',
                  }}
                  direction={{ xs: 'column', sm: 'row' }}
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
                      selectedZip: string
                    ) => {
                      handleSetValue('owner.physical_address', selectedAddress)
                      handleSetValue('owner.physical_city', selectedCity)
                      handleSetValue('owner.physical_state', selectedState)
                      handleSetValue('owner.physical_zip_code', selectedZip)
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <ControlledTextField
                    label="City"
                    onChange={(e) =>
                      handleSetValue('owner.physical_city', e.target.value)
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
                    onChange={(e) =>
                      handleSetValue(
                        'owner.physical_state',
                        e.target.value.toLocaleUpperCase()
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
                    onChange={(e) =>
                      handleSetValue('owner.physical_zip_code', e.target.value)
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
                  <Grid size={{ xs: 12, sm: 'auto' }}>
                    <Typography variant="h4">Mailing </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 'grow' }}>
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
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip placement="top" title="USGS well ID">
                  <ControlledTextField
                    label="Site ID"
                    fullWidth
                    control={control}
                    name="location.site_id"
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip
                  placement="top"
                  title="Alternate site or property name"
                >
                  <ControlledTextField
                    label="Site ID (Alternate)"
                    fullWidth
                    control={control}
                    name="location.alternate_site_id"
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip
                  placement="top"
                  title="Descriptive name for well, provided by user or owner. Usually owner last name + well use."
                >
                  <ControlledTextField
                    label="Site Name"
                    fullWidth
                    control={control}
                    name="location.site_name"
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip placement="top" title="Date site/location was visited">
                  <ControlledDateField
                    label="Site Date & Time (MT)"
                    control={control}
                    name="location.site_date"
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 5 }}>
                <ControlledTextField
                  showAsterisk={true}
                  type="number"
                  label={locationLabels[coordinateType][0]}
                  fullWidth
                  control={control}
                  name="location.coordinates.x"
                  onChange={(e) =>
                    handleCoordinateValidation(e, 'location.coordinates.x')
                  }
                  onBlur={handleCoordinateUpdate}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 5 }}>
                <ControlledTextField
                  showAsterisk={true}
                  type="number"
                  label={locationLabels[coordinateType][1]}
                  fullWidth
                  control={control}
                  name="location.coordinates.y"
                  onChange={(e) =>
                    handleCoordinateValidation(e, 'location.coordinates.y')
                  }
                  onBlur={handleCoordinateUpdate}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 2 }}>
                <ControlledSelectField
                  label="Coordinate Type"
                  control={control}
                  name="location.coordinates.type"
                  onChange={(e) =>
                    handleCoordinateTypeChange(e.target.value as 'utm' | 'gcs')
                  }
                  options={[
                    { value: 'gcs', label: 'GCS' },
                    { value: 'utm', label: 'UTM' },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <LoadingControlledSelectField
                  resetFn={() => {
                    setValue(
                      'location.coordinate_accuracy',
                      SchemaDefaults.location.coordinate_accuracy
                    )
                  }}
                  isLoading={CoordinateAccuraciesQuery.isFetching}
                  label="Coordinate Accuracy"
                  control={control}
                  name="location.coordinate_accuracy"
                  disabled={CoordinateAccuraciesQuery.isError}
                  isError={CoordinateAccuraciesQuery.isError}
                  errorMessage="Failed to load Coordinate Accuracies"
                  options={CoordinateAccuraciesQuery?.data
                    ?.sort((a, b) =>
                      a.Meaning.toLocaleLowerCase().localeCompare(
                        b.Meaning.toLocaleLowerCase()
                      )
                    )
                    ?.map((option) => {
                      return { value: option.Code, label: option.Meaning }
                    })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <LoadingControlledSelectField
                  resetFn={() => {
                    setValue(
                      'location.coordinate_method',
                      SchemaDefaults.location.coordinate_method
                    )
                  }}
                  isLoading={CoordinateMethodsQuery.isFetching}
                  label="Coordinate Method"
                  control={control}
                  name="location.coordinate_method"
                  disabled={CoordinateMethodsQuery.isError}
                  isError={CoordinateMethodsQuery.isError}
                  errorMessage="Failed to load Coordinate Methods"
                  options={CoordinateMethodsQuery?.data
                    ?.sort((a, b) =>
                      a.Meaning.toLocaleLowerCase().localeCompare(
                        b.Meaning.toLocaleLowerCase()
                      )
                    )
                    ?.map((option) => {
                      return { value: option.Code, label: option.Meaning }
                    })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip placement="top" title="UTM Zone (12 or 13)">
                  <ControlledTextField
                    type="number"
                    label="UTM zone"
                    control={control}
                    disabled={coordinateType === 'gcs'}
                    name="location.utm_zone"
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip placement="top" title="Horizontal datum">
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue(
                        'location.utm_datum',
                        SchemaDefaults.location.utm_datum
                      )
                    }}
                    isLoading={CoordinateDatumsQuery.isFetching}
                    label="UTM Datum"
                    control={control}
                    name="location.utm_datum"
                    disabled={
                      CoordinateDatumsQuery.isError || coordinateType === 'gcs'
                    }
                    isError={CoordinateDatumsQuery.isError}
                    errorMessage="Failed to load UTM datums"
                    options={CoordinateDatumsQuery?.data?.map((option) => {
                      return {
                        value: option.DATUMCODE,
                        label: option.DATUMCODE,
                      }
                    })}
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                {elevationQuery.isFetching ? (
                  <SkeletonFormField />
                ) : (
                  <ControlledTextField
                    type="number"
                    label="Elevation (ft)"
                    control={control}
                    name="location.elevation"
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                {elevationQuery.isFetching ? (
                  <SkeletonFormField />
                ) : (
                  <ControlledTextField
                    type="number"
                    label="Elevation Accuracy"
                    control={control}
                    name="location.elevation_accuracy"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">±</InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Tooltip placement="top" title="Vertical datum">
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue(
                        'location.elevation_datum',
                        SchemaDefaults.location.elevation_datum
                      )
                    }}
                    isLoading={
                      ElevationDatumsQuery.isFetching ||
                      elevationQuery.isFetching
                    }
                    label="Elevation Datum"
                    control={control}
                    name="location.elevation_datum"
                    disabled={ElevationDatumsQuery.isError}
                    isError={ElevationDatumsQuery.isError}
                    errorMessage="Failed to load ALT datums"
                    options={ElevationDatumsQuery?.data?.map((option) => {
                      return { value: option.Code, label: option.Code }
                    })}
                  />
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <LoadingControlledSelectField
                  resetFn={() => {
                    setValue(
                      'location.elevation_method',
                      SchemaDefaults.location.elevation_method
                    )
                    setNoteAppended(false)
                  }}
                  isLoading={ElevationMethodsQuery.isFetching}
                  label="Elevation Method"
                  control={control}
                  name="location.elevation_method"
                  disabled={ElevationMethodsQuery.isError}
                  isError={ElevationMethodsQuery.isError}
                  errorMessage="Failed to load elevation methods"
                  options={ElevationMethodsQuery?.data
                    ?.sort((a, b) =>
                      a.Meaning.toLocaleLowerCase().localeCompare(
                        b.Meaning.toLocaleLowerCase()
                      )
                    )
                    ?.map((option) => {
                      return { value: option.Code, label: option.Meaning }
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
              {noteAppended ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    disabled
                    multiline
                    minRows={4}
                    fullWidth
                    label="Message appended to Notes"
                    value={noteToAdd}
                  />
                </Grid>
              ) : null}
              <Grid size={12} sx={{ px: 4 }}>
                <Paper elevation={2}>
                  <Map
                    {...viewState}
                    ref={mapRef}
                    scrollZoom={false}
                    onMove={(evt) => setViewState(evt.viewState)}
                    mapboxAccessToken={settings.mapboxToken}
                    initialViewState={initialViewState}
                    terrain={{ source: 'mapbox-dem', exaggeration: 3 }}
                    style={style}
                    mapStyle={mapStyle(viewState.zoom)}
                  >
                    <NavigationControl position="top-right" />
                    {typeof x === 'number' &&
                      typeof y === 'number' &&
                      !isNaN(x) &&
                      !isNaN(y) && (
                        <Marker
                          {...(() => {
                            if (coordinateType === 'utm' && utmZone) {
                              const [lon, lat] = convertUTMToLonLat(
                                x,
                                y,
                                utmZone
                              )
                              return { longitude: lon, latitude: lat }
                            } else if (coordinateType === 'gcs') {
                              const [longitude, latitude] = [x, y]
                              if (
                                longitude < -180 ||
                                longitude > 180 ||
                                latitude < -90 ||
                                latitude > 90
                              ) {
                                console.error('Invalid GCS coordinates:', {
                                  longitude,
                                  latitude,
                                })
                                return {
                                  longitude: undefined,
                                  latitude: undefined,
                                }
                              }
                            }
                            return { longitude: x, latitude: y }
                          })()}
                          anchor="bottom"
                        >
                          <div
                            style={{
                              width: 15,
                              height: 15,
                              borderRadius: '50%',
                              backgroundColor: 'red',
                              border: '2px solid white',
                            }}
                          />
                        </Marker>
                      )}
                  </Map>
                </Paper>
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
                direction={{ xs: 'column', sm: 'row' }}
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
                  <Tooltip
                    placement="top"
                    title="Well identifier issued by the OSE"
                  >
                    <ControlledTextField
                      label="OSE Well Record"
                      fullWidth
                      control={control}
                      name="well.ose_well_id"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip placement="top" title="Total depth of well (ft)">
                    <ControlledTextField
                      type="number"
                      label="Well Depth (ft)"
                      fullWidth
                      control={control}
                      name="well.well_depth"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip
                    placement="top"
                    title="Total depth of hole drilled (ft)"
                  >
                    <ControlledTextField
                      type="number"
                      label="Hole Depth (ft)"
                      fullWidth
                      control={control}
                      name="well.hole_depth"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip placement="top" title="Diameter of the well casing">
                    <>
                      <ControlledTextField
                        type="number"
                        label="Outer Casing Diameter (ft)"
                        fullWidth
                        control={control}
                        name="well.casing_diameter"
                        warning={!!casingWarning}
                      />
                      {casingWarning && (
                        <FormHelperText sx={{ color: 'warning.main' }}>
                          {casingWarning}
                        </FormHelperText>
                      )}
                    </>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip placement="top" title="Depth of the well casing">
                    <ControlledTextField
                      type="number"
                      label="Casing Depth (ft)"
                      fullWidth
                      control={control}
                      name="well.casing_depth"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() =>
                      setValue(
                        'well.depth_source',
                        SchemaDefaults.well.depth_source
                      )
                    }
                    isLoading={DepthSourcesQuery.isFetching}
                    label="Depth Source"
                    title="Reference to person, agency, or document reporting hole/well depth information."
                    control={control}
                    name="well.depth_source"
                    disabled={DepthSourcesQuery.isError}
                    isError={DepthSourcesQuery.isError}
                    errorMessage="Failed to load depth sources"
                    options={DepthSourcesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() =>
                      setValue(
                        'well.completion_source',
                        SchemaDefaults.well.completion_source
                      )
                    }
                    isLoading={CompletionSourcesQuery.isFetching}
                    label="Completion Source"
                    title="Reference to person, agency, or document reporting hole/well completion information (same as Depth Source)"
                    control={control}
                    name="well.completion_source"
                    disabled={CompletionSourcesQuery.isError}
                    isError={CompletionSourcesQuery.isError}
                    errorMessage="Failed to load completion sources"
                    options={CompletionSourcesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() =>
                      setValue('well.status', SchemaDefaults.well.status)
                    }
                    isLoading={StatusQuery.isFetching}
                    label="Status"
                    control={control}
                    name="well.status"
                    disabled={StatusQuery.isError}
                    isError={StatusQuery.isError}
                    errorMessage="Failed to load statuses"
                    options={StatusQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 9 }}>
                  <LoadingControlledSelectWithChips
                    resetFn={() =>
                      setValue(
                        'well.monitoring_status',
                        SchemaDefaults.well.monitoring_status
                      )
                    }
                    isLoading={MonitoringStatusesQuery.isFetching}
                    label="Monitoring status"
                    fullWidth
                    control={control}
                    name="well.monitoring_status"
                    disabled={MonitoringStatusesQuery.isError}
                    isError={MonitoringStatusesQuery.isError}
                    errorMessage="Failed to load monitoring statuses"
                    multiple={true}
                    options={MonitoringStatusesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return {
                          label: option.Meaning,
                          value: option.Code,
                        }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() =>
                      setValue('well.formation', SchemaDefaults.well.formation)
                    }
                    isLoading={FormationsQuery.isFetching}
                    label="Formation"
                    title="Formation(s) or zone(s) the well was completed in"
                    control={control}
                    name="well.formation"
                    disabled={FormationsQuery.isError}
                    isError={FormationsQuery.isError}
                    errorMessage="Failed to load formations"
                    options={FormationsQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() =>
                      setValue(
                        'well.construction_method',
                        SchemaDefaults.well.construction_method
                      )
                    }
                    isLoading={ConstructionMethodsQuery.isFetching}
                    label="Construction Method"
                    title="Method used to drill/construct the well"
                    control={control}
                    name="well.construction_method"
                    disabled={ConstructionMethodsQuery.isError}
                    isError={ConstructionMethodsQuery.isError}
                    errorMessage="Failed to load construction methods"
                    options={ConstructionMethodsQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() =>
                      setValue(
                        'well.current_use',
                        SchemaDefaults.well.current_use
                      )
                    }
                    isLoading={CurrentUsesQuery.isFetching}
                    label="Current Use"
                    title="How is the well currently used?"
                    control={control}
                    name="well.current_use"
                    disabled={CurrentUsesQuery.isError}
                    isError={CurrentUsesQuery.isError}
                    errorMessage="Failed to load current uses"
                    options={CurrentUsesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip
                    placement="top"
                    title="Name of the drilling contractor who constructed the well"
                  >
                    <ControlledTextField
                      label="Driller Name"
                      fullWidth
                      control={control}
                      name="well.driller_name"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ControlledTextField
                    label="MP Description"
                    fullWidth
                    control={control}
                    name="well.measuring_point"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Tooltip
                    placement="top"
                    title="Reference to person, agency, or document reporting hole/well construction information"
                  >
                    <ControlledTextField
                      label="Data Source"
                      fullWidth
                      control={control}
                      name="well.data_source"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip
                    placement="top"
                    title="Enter the MP Height in feet. This value can be positive or negative, indicating the height above or below a reference point."
                  >
                    <ControlledTextField
                      type="number"
                      label="MP Height (ft)"
                      fullWidth
                      control={control}
                      name="well.mp_height"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Tooltip
                    placement="top"
                    title="Depth to water (ft bgs) at time of well completion"
                  >
                    <ControlledTextField
                      type="number"
                      label="Static Water"
                      fullWidth
                      control={control}
                      name="well.static_water"
                    />
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Tooltip
                    placement="top"
                    title="Additional notes regarding the casing (material, thickness, etc.)"
                  >
                    <ControlledTextField
                      multiline
                      label="Casing Description"
                      fullWidth
                      control={control}
                      name="well.casing_description"
                    />
                  </Tooltip>
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
              <Grid size={12}>
                <Typography variant="h2">Well Screens</Typography>
              </Grid>
              <Grid
                sx={{ width: '100%' }}
                container
                spacing={2}
                direction="column"
              >
                {fields.map((item, index) => (
                  <Grid container key={item.id} mb={2}>
                    <Grid size={12}>
                      <Typography variant="h6">
                        Well Screen {index + 1}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                      <Tooltip
                        placement="top"
                        title="Top of screen (bgs) if present"
                      >
                        <ControlledTextField
                          type="number"
                          label="Screen Top"
                          name={`well_screens[${index}].screen_top`}
                          control={control}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                      <Tooltip
                        placement="top"
                        title="Bottom/base of screen (bgs) if present"
                      >
                        <ControlledTextField
                          type="number"
                          label="Screen Bottom"
                          name={`well_screens[${index}].screen_bottom`}
                          control={control}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <ControlledTextField
                        label="Screen Description"
                        name={`well_screens[${index}].screen_description`}
                        multiline
                        control={control}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="warning"
                        onClick={() => remove(index)}
                        startIcon={<Delete />}
                      >
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                ))}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      append({
                        wdbid: '',
                        counter: '',
                        screen_top: '',
                        screen_bottom: '',
                        screen_description: '',
                      })
                    }
                    startIcon={<Add />}
                  >
                    Add Well Screen
                  </Button>
                </Grid>
                <FileSelectionSection
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  supportedFileTypes={supportedFileTypes}
                />
              </Grid>
              <Grid
                container
                size={12}
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                sx={{ paddingTop: '3rem', paddingBottom: '1rem' }}
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
                    {isFormSubmissionPending ? 'Submitting...' : 'Submit'}
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
          handleSetValue(
            'owner.owner_key',
            fallbackWithDefault(owner.OwnerKey, SchemaDefaults.owner.owner_key)
          )
          handleSetValue(
            'owner.first_name',
            fallbackWithDefault(
              owner.FirstName,
              SchemaDefaults.owner.first_name
            )
          )
          handleSetValue(
            'owner.last_name',
            fallbackWithDefault(owner.LastName, SchemaDefaults.owner.last_name)
          )
          handleSetValue(
            'owner.email',
            fallbackWithDefault(owner.Email, SchemaDefaults.owner.email)
          )
          handleSetValue(
            'owner.phone',
            fallbackWithDefault(owner.Phone, SchemaDefaults.owner.phone)
          )
          handleSetValue(
            'owner.cell_phone',
            fallbackWithDefault(
              owner.CellPhone,
              SchemaDefaults.owner.cell_phone
            )
          )
          handleSetValue(
            'owner.second_first_name',
            fallbackWithDefault(
              owner.SecondFirstName,
              SchemaDefaults.owner.second_first_name
            )
          )
          handleSetValue(
            'owner.second_last_name',
            fallbackWithDefault(
              owner.SecondLastName,
              SchemaDefaults.owner.second_last_name
            )
          )
          handleSetValue(
            'owner.second_ctct_email',
            fallbackWithDefault(
              owner.SecondCtctEmail,
              SchemaDefaults.owner.second_ctct_email
            )
          )
          handleSetValue(
            'owner.second_ctct_phone',
            fallbackWithDefault(
              owner.SecondCtctPhone,
              SchemaDefaults.owner.second_ctct_phone
            )
          )
          handleSetValue(
            'owner.physical_address',
            fallbackWithDefault(
              owner.PhysicalAddress,
              SchemaDefaults.owner.physical_address
            )
          )
          handleSetValue(
            'owner.physical_city',
            fallbackWithDefault(
              owner.PhysicalCity,
              SchemaDefaults.owner.physical_city
            )
          )
          handleSetValue(
            'owner.physical_state',
            fallbackWithDefault(
              owner.PhysicalState,
              SchemaDefaults.owner.physical_state
            )
          )
          handleSetValue(
            'owner.physical_zip_code',
            fallbackWithDefault(
              owner.PhysicalZipCode,
              SchemaDefaults.owner.physical_zip_code
            )
          )
          handleSetValue(
            'owner.mailing_address',
            fallbackWithDefault(
              owner.MailingAddress,
              SchemaDefaults.owner.mailing_address
            )
          )
          handleSetValue(
            'owner.mail_city',
            fallbackWithDefault(owner.MailCity, SchemaDefaults.owner.mail_city)
          )
          handleSetValue(
            'owner.mail_state',
            fallbackWithDefault(
              owner.MailState,
              SchemaDefaults.owner.mail_state
            )
          )
          handleSetValue(
            'owner.mail_zip_code',
            fallbackWithDefault(
              owner.MailZipCode,
              SchemaDefaults.owner.mail_zip_code
            )
          )
        }}
      />
    </>
  )
}
