import { useStepsForm } from '@refinedev/react-hook-form'
import { IGroundwaterLevelForm } from '@/interfaces/dataforge/IGroundwaterLevel'
import { Box, Button, Step, StepButton, Stepper } from '@mui/material'
import { Create, SaveButton } from '@refinedev/mui'
import { SelectThingComponent } from '@/components/SelectThingComponent'
import { GroundwaterLevelEntryComponent } from '@/components/GroundwaterLevelEntryComponent'
import { HttpError } from '@refinedev/core'
import { Nullable } from '@/interfaces'
import { useTheme } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'

export const GroundwaterLevelForm: React.FC = () => {
  const stepTitles = ['Location', 'Sample', 'Sensor', 'Observation']
  const {
    saveButtonProps,
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    steps: { currentStep, gotoStep },
  } = useStepsForm<
    IGroundwaterLevelForm,
    HttpError,
    Nullable<IGroundwaterLevelForm>
  >({
    defaultValues: {
      measuring_point_height: 1,
      depth_to_water: 123,
      observation_timestamp: new Date(),
      observed_property: 'groundwater level',
    },
  })

  const theme = useTheme()
  const isSmallOrLess = useMediaQuery(theme.breakpoints.down('sm'))

  const renderFormByStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <SelectThingComponent
            control={control}
            errors={errors}
            watch={watch}
          />
        )
      case 1:
        return <div>Sample Form</div>
      case 2:
        return <div>Sensor Form</div>
      case 3:
        return (
          <GroundwaterLevelEntryComponent
            register={register}
            control={control}
            errors={errors}
            watch={watch}
          />
        )
      default:
        return <></>
    }
  }

  return (
    <Create
      isLoading={formLoading}
      saveButtonProps={saveButtonProps}
      footerButtons={
        <>
          {currentStep > 0 && (
            <Button
              onClick={() => {
                gotoStep(currentStep - 1)
              }}
            >
              Previous
            </Button>
          )}
          {currentStep < stepTitles.length - 1 && (
            <Button
              onClick={() => {
                gotoStep(currentStep + 1)
              }}
            >
              Next
            </Button>
          )}
          {currentStep === stepTitles.length - 1 && (
            <SaveButton onClick={handleSubmit(onFinish)} />
          )}
        </>
      }
    >
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <Stepper
          nonLinear
          activeStep={currentStep}
          orientation={isSmallOrLess ? 'vertical' : 'horizontal'}
        >
          {stepTitles.map((label, index) => (
            <Step key={label}>
              <StepButton onClick={() => gotoStep(index)}>{label}</StepButton>
            </Step>
          ))}
        </Stepper>
        <br />
        {renderFormByStep(currentStep)}
      </Box>
    </Create>
  )
}
