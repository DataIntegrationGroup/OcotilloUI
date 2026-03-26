import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  useFieldArray,
  useForm,
  useWatch,
  Controller,
  type Path,
} from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Add, ArrowBack, Save } from '@mui/icons-material'
import { MapRef, Source, Layer, type ViewState } from 'react-map-gl'
import { useGo, useResourceParams } from '@refinedev/core'
import { MapComponent } from '@/components'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { ControlledNumberField } from '@/components/Controlled/ControlledNumberField'
import { ControlledSelectField } from '@/components/Controlled/ControlledSelectField'
import { ControlledSelectWithChipsField } from '@/components/Controlled/ControlledSelectWithChipsField'
import { ControlledTextField } from '@/components/Controlled/ControlledTextField'
import { CreateEditContact } from '@/components/form/contact/CreateEditContact'
import { CreateEditWell } from '@/components/form/thing/CreateEditWell'
import { CreateEditWellScreen } from '@/components/form/thing/CreateEditWellScreen'
import { useAccessCapabilities, useLexicon } from '@/hooks'
import type { IWellEditForm } from '@/interfaces/ocotillo'
import {
  createEmptyWellEditForm,
  loadWellEditForm,
  submitWellEditForm,
} from './well-edit.service'

const SectionCard = ({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
    <CardHeader
      title={
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
      }
      action={action}
      sx={{ pb: 0 }}
    />
    <CardContent sx={{ pt: 2 }}>{children}</CardContent>
  </Card>
)

const BooleanSelectField = ({
  control,
  name,
  label,
}: {
  control: any
  name: Path<IWellEditForm>
  label: string
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <FormControl fullWidth error={!!fieldState.error}>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={
            field.value === true ? 'true' : field.value === false ? 'false' : ''
          }
          onChange={(event) => {
            const value = event.target.value
            field.onChange(value === '' ? null : value === 'true')
          }}
        >
          <MenuItem value="">Unknown</MenuItem>
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </Select>
      </FormControl>
    )}
  />
)

export const WellEdit: React.FC = () => {
  const go = useGo()
  const { id } = useResourceParams()
  const thingId = Number(id)
  const { canManageAmp } = useAccessCapabilities()
  const { options: wellPumpTypeOptions } = useLexicon({
    category: 'well_pump_type',
  })
  const { options: wellConstructionMethodOptions } = useLexicon({
    category: 'well_construction_method',
  })
  const { options: wellPurposeOptions } = useLexicon({
    category: 'well_purpose',
  })
  const { options: coordinateMethodOptions } = useLexicon({
    category: 'coordinate_method',
  })
  const { options: elevationMethodOptions } = useLexicon({
    category: 'elevation_method',
  })
  const { options: wellStatusOptions } = useLexicon({
    category: 'status',
  })
  const { options: casingMaterialOptions } = useLexicon({
    category: 'casing_material',
  })
  const emptyOption = { value: '', label: 'None' }

  const form = useForm<IWellEditForm>({
    defaultValues: createEmptyWellEditForm(
      Number.isFinite(thingId) ? thingId : 0
    ),
    mode: 'onSubmit',
  })

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = form

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({ control, name: 'contacts' })

  const {
    fields: wellScreenFields,
    append: appendWellScreen,
    remove: removeWellScreen,
  } = useFieldArray({ control, name: 'wellScreens' })

  const loadedQuery = useQuery({
    queryKey: ['ocotillo', 'well-edit', thingId],
    enabled: Number.isFinite(thingId),
    queryFn: () => loadWellEditForm(thingId),
  })

  const mutation = useMutation({
    mutationFn: (data: IWellEditForm) => submitWellEditForm(thingId, data),
    onSuccess: () => {
      go({ to: `/ocotillo/well/show/${thingId}`, type: 'push' })
    },
    onError: (error: any) => {
      const fieldErrors = error?.fieldErrors ?? error?.errors
      if (!fieldErrors) return

      Object.entries(fieldErrors).forEach(([path, messages]) => {
        setError(path as Path<IWellEditForm>, {
          type: 'server',
          message: Array.isArray(messages)
            ? messages.join('\n')
            : String(messages),
        })
      })
    },
  })

  useEffect(() => {
    if (loadedQuery.data) {
      reset(loadedQuery.data)
    }
  }, [loadedQuery.data, reset])

  const latitude = useWatch({ control, name: 'location.latitude' })
  const longitude = useWatch({ control, name: 'location.longitude' })

  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 34.068279,
    longitude: -106.904192,
    zoom: 8,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, left: 0, right: 0, bottom: 0 },
  })

  useEffect(() => {
    if (latitude == null || longitude == null) return

    if (
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
    ) {
      const lat = Number(latitude)
      const lon = Number(longitude)
      setValue('location.point', `POINT(${lon} ${lat})`)
      setViewState((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        zoom: 11,
      }))
      mapRef.current?.flyTo({ center: [lon, lat] })
    }
  }, [latitude, longitude, setValue])

  const onMapClick = (event: any) => {
    const { lng, lat } = event.lngLat
    setValue('location.longitude', Number(lng), { shouldDirty: true })
    setValue('location.latitude', Number(lat), { shouldDirty: true })
    setValue('location.point', `POINT(${lng} ${lat})`, { shouldDirty: true })
  }

  const handleContactAdd = () => {
    appendContact({
      name: '',
      organization: '',
      role: '',
      contact_type: '',
      release_status: 'private',
      emails: [],
      phones: [],
      addresses: [],
    })
  }

  const handleWellScreenAdd = () => {
    appendWellScreen({
      screen_depth_top: null,
      screen_depth_bottom: null,
      screen_type: null,
      screen_description: null,
      release_status: 'draft',
    })
  }

  const applyBlankContact = () => handleContactAdd()
  const applyBlankScreen = () => handleWellScreenAdd()

  const handleSave = async (data: IWellEditForm) => {
    clearErrors()
    await mutation.mutateAsync(data)
  }

  const topActions = (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      <Button
        startIcon={<ArrowBack />}
        variant="outlined"
        onClick={() =>
          go({ to: `/ocotillo/well/show/${thingId}`, type: 'push' })
        }
      >
        Back
      </Button>
      <Button
        startIcon={<Save />}
        variant="contained"
        onClick={handleSubmit(handleSave)}
        disabled={mutation.isPending}
      >
        Save Changes
      </Button>
    </Box>
  )

  if (!canManageAmp && !loadedQuery.isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          You do not have access to edit this well.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <AppBreadcrumb />
      <Stack spacing={3} component="form" onSubmit={handleSubmit(handleSave)}>
        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight={700}>
                Edit Well
              </Typography>
              {topActions}
            </Stack>
          </CardContent>
        </Card>

        {loadedQuery.error ? (
          <Alert severity="error">Failed to load the well editor.</Alert>
        ) : null}

        <SectionCard title="Well Details">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 12 }}>
              <CreateEditWell
                control={control}
                errors={errors}
                mode="step"
                fieldPrefix="well."
                showWellType={false}
                showNotes={false}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="well.first_visit_date"
                label="First Visit Date"
                type="date"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="well.well_completion_date"
                label="Well Completion Date"
                type="date"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="well.well_completion_date_source"
                label="Completion Date Source"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="well.well_driller_name"
                label="Driller Name"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledSelectField
                control={control}
                name="well.well_construction_method"
                label="Construction Method"
                options={[emptyOption, ...wellConstructionMethodOptions]}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="well.well_construction_method_source"
                label="Construction Method Source"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledSelectField
                control={control}
                name="well.well_pump_type"
                label="Pump Type"
                options={[emptyOption, ...wellPumpTypeOptions]}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="well.formation_completion_code"
                label="Formation Completion Code"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <BooleanSelectField
                control={control}
                name="well.is_suitable_for_datalogger"
                label="Suitable for Datalogger"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledSelectField
                control={control}
                name="well.well_status"
                label="Well Status"
                options={[emptyOption, ...wellStatusOptions]}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledNumberField
                control={control}
                name="well.measuring_point_height"
                label="Measuring Point Height"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="well.measuring_point_description"
                label="Measuring Point Description"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledSelectWithChipsField
                control={control}
                name="well.well_casing_materials"
                label="Casing Materials"
                options={casingMaterialOptions}
                multiple
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledSelectWithChipsField
                control={control}
                name="well.well_purposes"
                label="Well Purposes"
                options={wellPurposeOptions}
                multiple
              />
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard title="Location">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="location.name"
                label="Location Name"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="location.release_status"
                label="Release Status"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledNumberField
                control={control}
                name="location.latitude"
                label="Latitude"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledNumberField
                control={control}
                name="location.longitude"
                label="Longitude"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledNumberField
                control={control}
                name="location.coordinate_accuracy"
                label="Coordinate Accuracy"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledSelectField
                control={control}
                name="location.coordinate_method"
                label="Coordinate Method"
                options={[emptyOption, ...coordinateMethodOptions]}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledNumberField
                control={control}
                name="location.elevation"
                label="Elevation"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledNumberField
                control={control}
                name="location.elevation_accuracy"
                label="Elevation Accuracy"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledSelectField
                control={control}
                name="location.elevation_method"
                label="Elevation Method"
                options={[emptyOption, ...elevationMethodOptions]}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <ControlledTextField
                control={control}
                name="location.point"
                label="WKT Point"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <ControlledTextField
                control={control}
                name="location.notes"
                label="Location Notes"
                multiline
                minRows={3}
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Tap the map to update coordinates.
              </Typography>
              <Box ref={containerRef} sx={{ width: '100%' }}>
                <MapComponent
                  containerRef={containerRef}
                  mapRef={mapRef}
                  initialViewState={viewState}
                  style={{ height: 320, width: '100%' }}
                  showDrawControls={{ show: false }}
                  onClick={onMapClick}
                >
                  {latitude != null &&
                  longitude != null &&
                  Number.isFinite(Number(latitude)) &&
                  Number.isFinite(Number(longitude)) ? (
                    <Source
                      id="location-marker"
                      type="geojson"
                      data={{
                        type: 'FeatureCollection',
                        features: [
                          {
                            type: 'Feature',
                            geometry: {
                              type: 'Point',
                              coordinates: [
                                Number(longitude),
                                Number(latitude),
                              ],
                            },
                            properties: {},
                          },
                        ],
                      }}
                    >
                      <Layer
                        id="location-marker"
                        type="circle"
                        paint={{
                          'circle-radius': 6,
                          'circle-color': '#B42222',
                          'circle-stroke-color': '#ffffff',
                          'circle-stroke-width': 1,
                        }}
                      />
                    </Source>
                  ) : null}
                </MapComponent>
              </Box>
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard
          title="Contacts"
          action={
            <Button
              startIcon={<Add />}
              variant="outlined"
              onClick={applyBlankContact}
            >
              Add Contact
            </Button>
          }
        >
          <Stack spacing={2}>
            {contactFields.length === 0 ? (
              <Alert severity="info">No contacts yet. Add one to begin.</Alert>
            ) : null}
            {contactFields.map((field, index) => (
              <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
                <CreateEditContact
                  control={control}
                  errors={errors}
                  mode="step"
                  fieldPrefix={`contacts.${index}.`}
                  showDynamicArrays
                  contactIndex={index}
                  onRemoveContact={removeContact}
                  onAddContact={
                    index === contactFields.length - 1
                      ? applyBlankContact
                      : undefined
                  }
                  canRemoveContact={contactFields.length > 0}
                />
              </Paper>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Well Screens"
          action={
            <Button
              startIcon={<Add />}
              variant="outlined"
              onClick={applyBlankScreen}
            >
              Add Screen
            </Button>
          }
        >
          <Stack spacing={2}>
            {wellScreenFields.length === 0 ? (
              <Alert severity="info">
                No well screens yet. Add one to begin.
              </Alert>
            ) : null}
            {wellScreenFields.map((field, index) => (
              <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
                <CreateEditWellScreen
                  control={control}
                  errors={errors}
                  mode="step"
                  fieldPrefix={`wellScreens.${index}.`}
                  screenIndex={index}
                  onRemoveScreen={removeWellScreen}
                  onAddScreen={
                    index === wellScreenFields.length - 1
                      ? applyBlankScreen
                      : undefined
                  }
                  canRemoveScreen={wellScreenFields.length > 0}
                />
              </Paper>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title="Notes">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="notes.general_notes"
                label="General Notes"
                multiline
                minRows={4}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="notes.construction_notes"
                label="Construction Notes"
                multiline
                minRows={4}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="notes.measuring_notes"
                label="Measuring Notes"
                multiline
                minRows={4}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="notes.site_notes"
                label="Site Notes"
                multiline
                minRows={4}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="notes.water_notes"
                label="Water Notes"
                multiline
                minRows={4}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ControlledTextField
                control={control}
                name="notes.sampling_procedure_notes"
                label="Sampling Procedure Notes"
                multiline
                minRows={4}
              />
            </Grid>
          </Grid>
        </SectionCard>

        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <Button
                startIcon={<ArrowBack />}
                variant="outlined"
                onClick={() =>
                  go({ to: `/ocotillo/well/show/${thingId}`, type: 'push' })
                }
              >
                Back
              </Button>
              <Button
                startIcon={<Save />}
                variant="contained"
                type="submit"
                disabled={mutation.isPending}
              >
                Save Changes
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
