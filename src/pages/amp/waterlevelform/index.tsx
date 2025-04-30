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
import { ControlledCheckbox, ControlledTextField } from '@/components'
import {
  createWaterLevelForm,
  getEquipmentTypes,
  getMeasuringAgencies,
} from './water_level.service'
import { LoadingControlledSelectField } from '@/components/amp/wellinventoryform'
import { ControlledDateField } from '@/components/Controlled/ControlledDateField'
import { useEffect } from 'react'

export const WaterLevelForm = () => {
  const theme = useTheme()

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
      await mutateAsync({ body: data, photos: [] })
      reset()
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  const EquipmentTypeQuery = getEquipmentTypes()
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
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    label="Point ID"
                    control={control}
                    name="pointid"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
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
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    type="number"
                    label="Hold (ft)"
                    control={control}
                    name="hold"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    type="number"
                    label="Cut (ft)"
                    control={control}
                    name="cut"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    value={watch('depth_of_water')}
                    type="number"
                    label="Depth to Water (ft)"
                    control={control}
                    name="depth_of_water"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledDateField
                    label="Measurement Date"
                    control={control}
                    name="measurement_date"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    label="Level Status"
                    control={control}
                    name="level_status"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    label="Data Quality"
                    control={control}
                    name="data_quality"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    label="Data Sources"
                    control={control}
                    name="data_sources"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    type="number"
                    label="MP Height"
                    control={control}
                    name="mp_height"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    label="Measurement Method"
                    control={control}
                    name="measurement_method"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    label="Measured By"
                    control={control}
                    name="measured_by"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
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
                        a.Meaning.toLocaleLowerCase().localeCompare(
                          b.Meaning.toLocaleLowerCase()
                        )
                      )
                      ?.map((option) => {
                        return { value: option.Code, label: option.Meaning }
                      })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    type="text"
                    label="Data Sources"
                    control={control}
                    name="data_sources"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    multiline
                    label="Notes"
                    name="notes"
                    control={control}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
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
                      onClick={() => reset(SchemaDefaults)}
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
