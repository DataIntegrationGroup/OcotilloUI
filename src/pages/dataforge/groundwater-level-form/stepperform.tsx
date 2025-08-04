import { useStepsForm } from '@refinedev/react-hook-form'
import { IGroundwaterLevelForm } from '@/interfaces/dataforge/IGroundwaterLevel'
import { HttpError, useNotification } from '@refinedev/core'
import { Nullable } from '@/interfaces'
import { useMutation } from '@tanstack/react-query'
import {
  groundwaterLevelStepSchemas,
  SchemaDefaults,
} from './groundwater-level-form.schema'

import { FormStepper } from '@/components/form/stepper/FormStepper'
import {
  ObservationStep,
  ReviewStep,
  SampleStep,
  WellStep,
} from '@/pages/dataforge/groundwater-level-form/step-components'
import { yupResolver } from '@hookform/resolvers/yup'
import { createGroundwaterLevelForm } from '@/pages/dataforge/groundwater-level-form/groundwater-level-form.service'

export const GroundwaterLevelForm: React.FC = () => {
  // ---------------------------------------------------------------------------
  // Step Labels
  // ---------------------------------------------------------------------------
  const { open, close } = useNotification()
  const steps = ['Well', 'Sample', 'Observation', 'Review & Submit']

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    trigger,
    formState: { errors },
    steps: { currentStep, gotoStep },
  } = useStepsForm<
    IGroundwaterLevelForm,
    HttpError,
    Nullable<IGroundwaterLevelForm>
  >({
    resolver: (data, ctx, opts) =>
      yupResolver(groundwaterLevelStepSchemas[currentStep])(data, ctx, opts),
    defaultValues: SchemaDefaults,
  })

  // ------------------------------------------------------------
  // Form Submission Mutation
  // ------------------------------------------------------------
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createGroundwaterLevelForm,
    onMutate: () => {
      open?.({
        key: 'groundwater-level-submission',
        type: 'progress',
        message: 'Submitting Well Inventory Form...',
      })
    },
    onSuccess: () => {
      close?.('groundwater-level-submission')
      open?.({
        type: 'success',
        message: 'Form Submitted Successfully!',
        description: 'Your well inventory form has been submitted.',
      })
      reset(SchemaDefaults)
      gotoStep(0)
    },
    onError: (error) => {
      close?.('groundwater-level-submission')
      open?.({
        type: 'error',
        message: 'Failed to Submit Form',
        description: 'Please check your input and try again later.',
      })
      console.error('Form submission error:', error)
    },
  })

  // ------------------------------------------------------------
  // Form Handlers
  // ------------------------------------------------------------

  const handleFormSubmit = async (data: IGroundwaterLevelForm) => {
    try {
      await mutateAsync(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleReset = () => {
    reset(SchemaDefaults)
    gotoStep(0)
  }

  const handleNext = async () => {
    const isValid = await trigger()
    if (isValid) gotoStep(currentStep + 1)
  }

  const handleBack = () => {
    gotoStep(currentStep - 1)
  }

  const renderFormByStep = (step: number) => {
    switch (step) {
      case 0:
        return <WellStep control={control} watch={watch} errors={errors} />
      case 1:
        return <SampleStep control={control} watch={watch} errors={errors} />
      case 2:
        return (
          <ObservationStep
            register={register}
            control={control}
            watch={watch}
            errors={errors}
          />
        )
      case 3:
        return <ReviewStep watch={watch} />
      default:
        return <></>
    }
  }

  return (
    <FormStepper
      title="Groundwater Level Form"
      steps={steps}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit(handleFormSubmit)}
      onReset={handleReset}
      isSubmitting={isPending}
    >
      {renderFormByStep(currentStep)}
    </FormStepper>
  )
}
