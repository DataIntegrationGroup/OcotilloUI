import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
} from '@mui/material'
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
import { ControlledTextField } from '@/components'
import { createWaterLevelForm, getEquipmentTypes } from './water_level.service'
import { LoadingControlledSelectField } from '@/components/amp/wellinventoryform'

export const WaterLevelForm = () => {
  const theme = useTheme()

  const { control, handleSubmit, reset, setValue, watch } =
    useForm<IWaterLevelForm>({
      defaultValues: SchemaDefaults,
      resolver: yupResolver(WaterLevelSchema),
    })

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
                  <LoadingControlledSelectField
                    resetFn={() => {
                      setValue('type', SchemaDefaults.type)
                    }}
                    isLoading={EquipmentTypeQuery.isFetching}
                    label="Type"
                    title="Type of site/monitoring location"
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
                    label="Depth to Water BGS"
                    control={control}
                    name="DepthToWaterBGS"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ControlledTextField
                    multiline
                    type="text"
                    name="Notes"
                    label="Notes"
                    control={control}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </>
  )
}
