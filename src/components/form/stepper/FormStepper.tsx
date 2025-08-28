import React from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  StepContent,
  Divider,
} from '@mui/material'
import { NavigateNext, NavigateBefore, Check } from '@mui/icons-material'

interface FormStepperProps {
  title?: string
  steps: string[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
  onReset?: () => void
  isSubmitting?: boolean
  children: React.ReactNode
  showResetButton?: boolean
  onStepClick?: (step: number) => void
}

/**
 * FormStepper - Reusable multi-step form component
 * 
 * @param title - form title (optional)
 * @param steps - array of step labels
 * @param currentStep - current active step (0-based)
 * @param onNext - function to handle next step
 * @param onBack - function to handle previous step
 * @param onSubmit - function to handle form submission
 * @param onReset - function to handle form reset (optional)
 * @param isSubmitting - loading state for submit button
 * @param children - step content to render
 * @param showResetButton - whether to show reset button (default: true)
 * @param onStepClick - function to handle step click (optional)
 *
 *  Example:
 * <FormStepper
 *   title="Well Inventory Form"
 *   steps={["Step 1", "Step 2", "Step 3"]}
 *   currentStep={currentStep}
 *   onNext={handleNext}
 *   onBack={handleBack}
 *   onSubmit={handleSubmit}
 *   isSubmitting={isPending}
 *   onStepClick={handleStepClick}
 * >
 *   {renderFormByStep(currentStep)}
 * </FormStepper>
 * 
 * @NOTE renderFormByStep is a function that renders the step content for the current step 
 * Following Refine's useStepsForm docs
 * const renderFormByStep = (step: number) => {
    switch (step) {
      case 0:
        return <LocationStep control={control} watch={watch} setValue={setValue} errors={errors} />
      case 1: etc...
    }
 */

export const FormStepper: React.FC<FormStepperProps> = ({
  title = "Multi-Step Form",
  steps,
  currentStep,
  onNext,
  onBack,
  onSubmit,
  onReset,
  isSubmitting = false,
  children,
  showResetButton = true,
  onStepClick
}) => {
  return (
    <Card>
      <CardHeader title={title} />
      <CardContent sx={{ padding: '2rem' }}>
        <Box
          component="form"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
            }
          }}
        >
          <Stepper activeStep={currentStep} orientation="vertical" sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepButton 
                  onClick={() => onStepClick?.(index)}
                >
                  <StepLabel>{label}</StepLabel>
                </StepButton>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {index === currentStep && children}
                    {index === currentStep && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {index > 0 && (
                          <Button
                            onClick={onBack}
                            startIcon={<NavigateBefore />}
                            variant="outlined"
                          >
                            Back
                          </Button>
                        )}
                        {currentStep < steps.length - 1 ? (
                          <Button
                            type="button"
                            onClick={onNext}
                            endIcon={<NavigateNext />}
                            variant="contained"
                          >
                            Next
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={<Check />}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Form'}
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Form Actions */}
          {showResetButton && onReset && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onReset}
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
              </Box>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  )
} 