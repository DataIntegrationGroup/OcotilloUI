import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, useTheme } from '@mui/material'
import { useForm } from '@refinedev/react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { IWaterLevelForm } from '@/interfaces/amp'
import {
  WaterLevelSchema,
  SchemaDefaults,
} from '@/pages/amp/waterlevelform/water_level.schema'
import { Box } from '@mui/system'
import { useMutation } from '@tanstack/react-query'
import { useNotification } from '@refinedev/core'
import Grid from '@mui/material/Grid2'
import {
  ControlledCheckbox,
  ControlledTextField,
  ControlledDateField,
  AddPhotosSection,
} from '@/components'
import {
  createWaterLevelForm,
  getDataQualities,
  getDataSources,
  getEquipmentTypes,
  getLevelStatuses,
  getMeasurementMethods,
  getMeasuringAgencies,
} from './water_level.service'
import { LoadingControlledSelectField } from '@/components/amp/wellinventoryform'

export const WaterLevelForm = () => {
  const theme = useTheme()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const { control, handleSubmit, reset, setValue, watch } =
    useForm<IWaterLevelForm>({
      defaultValues: SchemaDefaults,
      resolver: yupResolver(WaterLevelSchema),
    })

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
      await mutateAsync({ body: data, photos: selectedFiles })
      reset()
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  const handlePhotoFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files

    if (files) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)])
    }
  }

  const handleDeleteFile = (fileToDelete: File) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToDelete)
    )
  }

  const EquipmentTypeQuery = getEquipmentTypes()
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
                <Grid container size={12}>
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <ControlledTextField
                      label="Point ID"
                      control={control}
                      name="pointid"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <LoadingControlledSelectField
                      resetFn={() => {
                        setValue('type', SchemaDefaults.type)
                      }}
                      isLoading={EquipmentTypeQuery.isFetching}
                      label="Type"
                      title=""
                      control={control}
                      name="type"
                      disabled={true}
                      isError={EquipmentTypeQuery.isError}
                      errorMessage="Failed to load equipment types"
                      options={EquipmentTypeQuery?.data
                        ?.sort((a, b) =>
                          a.Meaning?.toLocaleLowerCase().localeCompare(
                            b.Meaning?.toLocaleLowerCase()
                          )
                        )
                        ?.map((option) => {
                          return { value: option.Code, label: option.Meaning }
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
                <Grid size={{ xs: 12, md: 3 }}>
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="Measured By"
                    control={control}
                    name="measured_by"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
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
                <Grid size={12}>
                  <ControlledCheckbox
                    label="Sample Collected? (If yes, use sample collection form)"
                    control={control}
                    name="sample_collected"
                  />
                </Grid>
                <Grid size={12}>
                  <ControlledCheckbox
                    label="Is it possible to sample this well?"
                    control={control}
                    name="possibe_to_sample"
                  />
                </Grid>
                <Grid size={12}>
                  <ControlledCheckbox
                    label="Is this your preferred final value?"
                    control={control}
                    name="final_value"
                  />
                </Grid>
                <AddPhotosSection
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
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
                      onClick={() => {
                        reset(SchemaDefaults)
                        setSelectedFiles([])
                      }}
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
