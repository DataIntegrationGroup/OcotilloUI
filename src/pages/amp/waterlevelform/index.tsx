import { useContext, useEffect, useId, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  keyframes,
  Paper,
  useTheme,
} from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { Map, Marker, NavigationControl } from 'react-map-gl'
import { useForm } from '@refinedev/react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { IWaterLevelForm } from '@/interfaces/amp'
import {
  WaterLevelSchema,
  SchemaDefaults,
} from '@/pages/amp/waterlevelform/water_level.schema'
import { Box } from '@mui/system'
import { settings } from '@/settings'
import { useMutation } from '@tanstack/react-query'
import { useNotification } from '@refinedev/core'
import Grid from '@mui/material/Grid2'
import {
  ControlledTextField,
  ControlledDateField,
  FileSelectionSection,
} from '@/components'
import {
  createWaterLevelForm,
  getCoordinatesFromPointId,
  getDataQualities,
  getDataSources,
  getLevelStatuses,
  getMeasurementMethods,
  getMeasuringAgencies,
  getWaterLevelsFromPointId,
} from './water_level.service'
import { LoadingControlledSelectField } from '@/components/amp/wellinventoryform'
import { ColorModeContext } from '@/contexts'
import { updateMapView } from '@/utils'
import { baseOption } from './water_level.base_options'
import { CloudDownload } from '@mui/icons-material'

export const WaterLevelForm = () => {
  const theme = useTheme()
  const mapRef = useRef(null)
  const initialViewState = {
    longitude: -106.4,
    latitude: 34.5,
    zoom: 10.5,
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
  const [longitude, setLongitude] = useState<number | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [option, setOption] = useState(baseOption)

  const style = { width: '100%', height: '500px' }
  const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
`
  const { mode } = useContext(ColorModeContext)
  const mapStyle = (zoom: number) =>
    zoom > 10
      ? 'mapbox://styles/mapbox/satellite-streets-v11'
      : mode === 'dark'
        ? 'mapbox://styles/mapbox/dark-v10'
        : 'mapbox://styles/mapbox/light-v10'

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<IWaterLevelForm>({
    defaultValues: SchemaDefaults,
    resolver: yupResolver(WaterLevelSchema),
  })

  const pointId = watch('pointid')
  const hold = watch('hold')
  const cut = watch('cut')

  useEffect(() => {
    if (hold && cut) {
      setValue('depth_of_water', hold - cut, {
        shouldTouch: true,
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [hold, cut, setValue])

  const {
    data: coords,
    isSuccess: coordsSuccess,
    isError: coordsError,
    isFetching: isFetchingCoords,
    refetch: refetchCoords,
  } = getCoordinatesFromPointId(pointId, false)

  const {
    data: waterLevels,
    isSuccess: waterSuccess,
    isError: waterError,
    isFetching: isFetchingWater,
    refetch: refetchWater,
  } = getWaterLevelsFromPointId(pointId, false)

  useEffect(() => {
    if (coordsError) {
      setError('pointid', {
        type: 'manual',
        message: 'Invalid Point ID or coordinates not found',
      })
      setLatitude(null)
      setLongitude(null)
      return
    }

    if (coordsSuccess && coords) {
      clearErrors('pointid')
      setLongitude(coords.x)
      setLatitude(coords.y)

      if (!isNaN(coords.x) && !isNaN(coords.y)) {
        updateMapView(mapRef.current, coords.x, coords.y)
      }
    }
  }, [coordsSuccess, coordsError, coords])

  useEffect(() => {
    if (waterError) {
      setError('pointid', {
        type: 'manual',
        message: 'No water level data found for this Point ID',
      })

      // Reset the chart
      setOption({
        ...baseOption,
        title: {
          text: 'No Data',
          left: 'center',
        },
        series: [],
        dataset: [],
      })

      return
    }

    if (waterSuccess && waterLevels?.items?.length) {
      clearErrors('pointid')

      const series = [
        {
          type: 'line',
          showSymbol: true,
          symbolSize: 6,
          name: 'Depth to Water',
          encode: { x: 'date', y: 'depth' },
          emphasis: { focus: 'series' },
        },
      ]

      const dataset = [
        {
          source: waterLevels?.items?.map((wl) => ({
            date: wl.TimeMeasured?.trim()
              ? `${wl.DateMeasured}-${wl.TimeMeasured.trim()}`
              : wl.DateMeasured,
            depth: wl.DepthToWaterBGS,
          })),
        },
      ]

      setOption({
        ...baseOption,
        series,
        dataset,
        yAxis: {
          ...baseOption.yAxis,
          name: 'Depth to Water (ft bgs)',
        },
        title: {
          text: `Water Levels for ${pointId}`,
          left: 'center',
        },
      })
    }
  }, [waterSuccess, waterError, waterLevels])

  const { open, close } = useNotification()

  const { mutateAsync, isPending: isFormSubmissionPending } = useMutation({
    mutationFn: createWaterLevelForm,
    onMutate: () => {
      open?.({
        key: 'water-level-submission',
        type: 'progress',
        message: 'Submitting Well Inventory Form...',
      })
    },
    onSuccess: () => {
      close?.('water-level-submission')
      open?.({
        type: 'success',
        message: 'Form Submitted Successfully!',
        description: 'Your well inventory form has been submitted.',
      })
    },
    onError: () => {
      close?.('water-level-submission')
      open?.({
        type: 'error',
        message: 'Failed to Submit Form',
        description: 'Please check your input and try again later.',
      })
    },
  })

  const handleFormSubmit = async (data: IWaterLevelForm) => {
    try {
      await mutateAsync({
        body: data,
        files: selectedFiles,
        supportedFileTypes,
      })
      reset()
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  const handleReset = () => {
    reset(SchemaDefaults)
    setSelectedFiles([])

    // Clear map view
    setLatitude(null)
    setLongitude(null)

    // Clear chart
    setOption({
      ...baseOption,
      title: {
        text: 'Water Level Data',
        left: 'center',
      },
      series: [],
      dataset: [],
    })
  }

  const LevelStatusesQuery = getLevelStatuses()
  const DataSourcesQuery = getDataSources()
  const DataQualitiesQuery = getDataQualities()
  const MeasurementMethodsQuery = getMeasurementMethods()
  const MeasuringAgencyQuery = getMeasuringAgencies()

  return (
    <>
      <Card>
        <CardHeader title="Water Level Form" />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
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
                <Grid size={{ xs: 12, md: 6 }} sx={{ px: 4 }}>
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
                      {typeof longitude === 'number' &&
                        typeof latitude === 'number' &&
                        !isNaN(longitude) &&
                        !isNaN(latitude) && (
                          <Marker
                            longitude={longitude}
                            latitude={latitude}
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
                <Grid size={{ xs: 12, md: 6 }} sx={{ px: 4 }}>
                  <Paper elevation={2}>
                    <ReactECharts
                      key={useId()}
                      option={option}
                      style={style}
                      onEvents={{
                        click: (params: any) => {
                          console.debug('Data point clicked:', params)
                        },
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid container size={12}>
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <ControlledTextField
                      label="Point ID"
                      control={control}
                      name="pointid"
                      onBlur={async (e) => {
                        const value = e.target.value?.trim()
                        if (value) {
                          await Promise.all([refetchCoords(), refetchWater()])
                        }
                      }}
                      onChange={(e) => {
                        const uppercaseValue = e.target.value.toUpperCase()
                        setValue('pointid', uppercaseValue)
                      }}
                      onFocus={() => clearErrors('pointid')}
                      slotProps={{
                        input: {
                          endAdornment:
                            isFetchingCoords || isFetchingWater ? (
                              <InputAdornment position="end">
                                <CloudDownload
                                  color="secondary"
                                  sx={{
                                    animation: `${pulse} 1.5s ease-in-out infinite`,
                                  }}
                                />
                              </InputAdornment>
                            ) : null,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <LoadingControlledSelectField
                      resetFn={() => {
                        setValue(
                          'measurement_method',
                          SchemaDefaults.measurement_method
                        )
                      }}
                      isLoading={MeasurementMethodsQuery.isFetching}
                      label="Measurement Method"
                      title=""
                      control={control}
                      name="measurement_method"
                      isError={MeasurementMethodsQuery.isError}
                      errorMessage="Failed to load measurement methods"
                      options={MeasurementMethodsQuery?.data
                        ?.sort((a, b) =>
                          a.Meaning?.toLocaleLowerCase().localeCompare(
                            b.Meaning?.toLocaleLowerCase()
                          )
                        )
                        ?.map((option) => {
                          return {
                            value: option.Code,
                            label: option.Meaning,
                          }
                        })}
                    />
                  </Grid>
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="Hold (ft)"
                    control={control}
                    name="hold"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="Cut (ft)"
                    control={control}
                    name="cut"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                  <ControlledTextField
                    value={watch('depth_of_water')}
                    type="number"
                    label="Depth to Water (ft)"
                    control={control}
                    name="depth_of_water"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ControlledDateField
                    label="Measurement Date"
                    control={control}
                    name="measurement_date"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue('level_status', SchemaDefaults.level_status)
                    }}
                    isLoading={LevelStatusesQuery.isFetching}
                    label="Level Status"
                    title=""
                    control={control}
                    name="level_status"
                    isError={LevelStatusesQuery.isError}
                    errorMessage="Failed to load level statuses"
                    options={LevelStatusesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning?.toLocaleLowerCase().localeCompare(
                          b.Meaning?.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return {
                          value: option.Code,
                          label: option.Meaning,
                        }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue('data_quality', SchemaDefaults.data_quality)
                    }}
                    isLoading={DataQualitiesQuery.isFetching}
                    label="Data Quality"
                    title=""
                    control={control}
                    name="data_quality"
                    isError={DataQualitiesQuery.isError}
                    errorMessage="Failed to load data qualities"
                    options={DataQualitiesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning?.toLocaleLowerCase().localeCompare(
                          b.Meaning?.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return {
                          value: option.Code,
                          label: option.Meaning,
                        }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue('data_source', SchemaDefaults.data_source)
                    }}
                    isLoading={DataSourcesQuery.isFetching}
                    label="Data Source"
                    title=""
                    control={control}
                    name="data_source"
                    isError={DataSourcesQuery.isError}
                    errorMessage="Failed to load data sources"
                    options={DataSourcesQuery?.data
                      ?.sort((a, b) =>
                        a.Meaning?.toLocaleLowerCase().localeCompare(
                          b.Meaning?.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return {
                          value: option.Code,
                          label: option.Meaning,
                        }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ControlledTextField
                    type="number"
                    label="MP Height"
                    control={control}
                    name="mp_height"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="Measured By"
                    control={control}
                    name="measured_by"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue(
                        'measuring_agency',
                        SchemaDefaults.measuring_agency
                      )
                    }}
                    isLoading={MeasuringAgencyQuery.isFetching}
                    label="Measured Agency"
                    title=""
                    control={control}
                    name="measuring_agency"
                    isError={MeasuringAgencyQuery.isError}
                    errorMessage="Failed to load measuring agencies"
                    options={MeasuringAgencyQuery?.data
                      ?.sort((a, b) =>
                        a.Description.toLocaleLowerCase().localeCompare(
                          b.Description.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return {
                          value: option.Agency,
                          label: option.Description,
                        }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    multiline
                    label="Notes"
                    name="notes"
                    control={control}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    multiline
                    label="Describe Sampling Scenario"
                    name="sampling_scenario"
                    control={control}
                  />
                </Grid>
                <FileSelectionSection
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  supportedFileTypes={supportedFileTypes}
                />
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
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </>
  )
}
