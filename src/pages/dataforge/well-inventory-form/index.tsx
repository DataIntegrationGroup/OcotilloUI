import { useState } from 'react'
import { useStepsForm } from '@refinedev/react-hook-form'
import { useAutocomplete } from '@refinedev/mui'
import { useFieldArray, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNotification } from '@refinedev/core'
import { useMutation } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Autocomplete,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Add, Delete, NavigateNext, NavigateBefore, Check } from '@mui/icons-material'
import {
  ControlledTextField,
  ControlledRadioFormSelection,
} from '@/components'
import { IWellInventoryForm } from '@/interfaces/dataforge/IWellInventoryForm'
import { ILocation } from '@/interfaces/dataforge/ILocation'
import { createWellInventoryForm } from '@/pages/dataforge/well-inventory-form/well_inventory.service'
import { CreateEditLocation } from '@/components/form/location/CreateEditLocation'
import { CreateEditWell } from '@/components/form/thing/CreateEditWell'
import { CreateEditContact } from '@/components/form/contact/CreateEditContact'
import { FormReview } from '@/components/form/general/FormReview'

import { stepSchemas, SchemaDefaults } from './well_inventory.schema'

const steps = [
  'Location Information',
  'Well Information', 
  'Contacts',
  'Assets',
  'Review & Submit'
]

export const WellInventoryForm: React.FC = () => {
  const { open, close } = useNotification()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const { autocompleteProps: locationAutocompleteProps } = useAutocomplete<ILocation>({
    resource: 'dataforge.location',
    dataProviderName: 'dataforge',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
    steps: { currentStep, gotoStep },
    refineCore: { onFinish },
  } = useStepsForm<IWellInventoryForm>({
    defaultValues: SchemaDefaults,
    resolver: (data, ctx, opts) =>
      yupResolver(stepSchemas[currentStep])(data, ctx, opts),
    stepsProps: {
      isBackValidate: false,
    },
  })

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: 'contacts',
  })

  const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({
    control,
    name: 'assets',
  })

  const { mutateAsync, isPending } = useMutation({
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
      reset(SchemaDefaults)
      setSelectedFiles([])
      gotoStep(0) 
    },
    onError: (error) => {
      close?.('well-inventory-submission')
      open?.({
        type: 'error',
        message: 'Failed to Submit Form',
        description: 'Please check your input and try again later.',
      })
      console.error('Form submission error:', error)
    },
  })

  const handleFormSubmit = async (data: IWellInventoryForm) => {
    try {
      await mutateAsync(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleReset = () => {
    reset(SchemaDefaults)
    setSelectedFiles([])
    gotoStep(0)
  }

  const handleNext = async () => {
    const isValid = await trigger();
    if (isValid) gotoStep(currentStep + 1);
  };

  const handleBack = () => {
    gotoStep(currentStep - 1)
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <LocationStep control={control} watch={watch} setValue={setValue} errors={errors} locationAutocompleteProps={locationAutocompleteProps} />
      case 1:
        return <WellStep control={control} watch={watch} errors={errors} />
      case 2:
        return <ContactsStep control={control} watch={watch} setValue={setValue} errors={errors} contactFields={contactFields} appendContact={appendContact} removeContact={removeContact} />
      case 3:
        return <AssetsStep control={control} watch={watch} errors={errors} assetFields={assetFields} appendAsset={appendAsset} removeAsset={removeAsset} />
      case 4:
        return <ReviewStep watch={watch} />
      default:
        return null
    }
  }

  // ------------------------------------------------------------
  // MAIN STEPPER COMPONENT
  // ------------------------------------------------------------

  return (
    <Card>
      <CardHeader title="Well Inventory Form" />
      <CardContent sx={{ padding: '2rem' }}>
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
          <Stepper activeStep={currentStep} orientation="vertical" sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {renderStepContent(currentStep)}
                    {index === currentStep && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        {index > 0 && (
                          <Button
                            onClick={handleBack}
                            startIcon={<NavigateBefore />}
                            variant="outlined"
                          >
                            Back
                          </Button>
                        )}
                        {currentStep < steps.length - 1 ? (
                          <Button
                            type="button"
                            onClick={handleNext}
                            endIcon={<NavigateNext />}
                            variant="contained"
                          >
                            Next
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isPending}
                            startIcon={<Check />}
                          >
                            {isPending ? 'Submitting...' : 'Submit Form'}
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
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outlined"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset Form
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ------------------------------------------------------------
//BEGIN STEP COMPONENTS
// ------------------------------------------------------------

//Location Step #1 --------------------------------------------
const LocationStep: React.FC<{
  control: any
  watch: any
  setValue: any
  errors: any
  locationAutocompleteProps: any
}> = ({ control, watch, setValue, errors, locationAutocompleteProps }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Typography variant="h6" gutterBottom>
        Location Information
      </Typography>
    </Grid>

    {/* Location Mode Selection */}
    <Grid size={12}>
      <Card sx={{ p: 2 }}>
        <ControlledRadioFormSelection
          control={control}
          name="locationMode"
          label="Location Selection"
          options={[
            {
              value: 'new',
              label: 'Create a new location',
              description: 'Add new location details for this well'
            },
            {
              value: 'existing',
              label: 'Use existing location',
              description: 'Select from database'
            }
          ]}
          onValueChange={(value) => {
            if (value === 'existing') {
              setValue('location.name', '')
              setValue('location.notes', '')
              setValue('location.point', '')
              setValue('location.release_status', 'public')
            } else {
              setValue('selectedLocationId', undefined)
            }
          }}
        />
      </Card>
    </Grid>

    {/* Existing Location Selector */}
    {watch('locationMode') === 'existing' && (
      <Grid size={12}>
        <Controller
          name="selectedLocationId"
          control={control}
          rules={{ required: 'Please select a location' }}
          render={({ field, fieldState }) => (
              <Autocomplete
               {...locationAutocompleteProps}
               value={locationAutocompleteProps.options.find((option: any) => option.id === field.value) || null}
               onChange={(_, newValue) => {
                 field.onChange((newValue as any)?.id || null)
               }}
               getOptionKey={(option: any) => option.id}
               getOptionLabel={(option: any) => option.name || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Existing Location"
                  margin="normal"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  required
                />
              )}
            />
          )}
        />
      </Grid>
    )}

    {/*  Location Form --------------------------------------*/}
    {/*  /components/form/location/CreateEditLocation.tsx */}
    {watch('locationMode') === 'new' && (
      <CreateEditLocation
        control={control}
        watch={watch}
        setValue={setValue}
        errors={errors}
        mode="step"
        fieldPrefix="location."
      />
    )}
  </Grid>
)

//Well Step #2 -----------------------------------------------
const WellStep: React.FC<{
  control: any
  watch: any
  errors: any
}> = ({ control, watch, errors }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Typography variant="h6" gutterBottom>
        Well Information
      </Typography>
    </Grid>

    {/*  Well Form ----------------------------------------*/}
    {/*  /components/form/thing/CreateEditWell.tsx */}
    <CreateEditWell
      control={control}
      errors={errors}
      mode="step"
      fieldPrefix="well."
    />
  </Grid>
)

//Contacts Step #3 -----------------------------------------------
const ContactsStep: React.FC<{
  control: any
  watch: any
  setValue: any
  errors: any
  contactFields: any
  appendContact: any
  removeContact: any
}> = ({ control, watch, setValue, errors, contactFields, appendContact, removeContact }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Typography variant="h6" gutterBottom>
        Contacts
      </Typography>
    </Grid>

    {contactFields.map((field, contactIndex) => (
      <Grid container key={field.id} spacing={2} sx={{ mb: 3 }}>
        {/*  Contact Form ----------------------------------------*/}
        {/*  /components/form/contact/CreateEditContact.tsx */}
        <CreateEditContact
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
          mode="step"
          fieldPrefix={`contacts.${contactIndex}.`}
          showDynamicArrays={true}
          contactIndex={contactIndex}
          onRemoveContact={removeContact}
          onAddContact={contactIndex === contactFields.length - 1 ? () => appendContact({
            name: '',
            role: 'contact',
            emails: [],
            phones: [],
            addresses: []
          }) : undefined}
          canRemoveContact={contactFields.length > 1}
          totalContacts={contactFields.length}
        />
      </Grid>
    ))}
  </Grid>
)

//Assets Step #4 -----------------------------------------------
const AssetsStep: React.FC<{
  control: any
  watch: any
  errors: any
  assetFields: any
  appendAsset: any
  removeAsset: any
}> = ({ control, watch, errors, assetFields, appendAsset, removeAsset }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Typography variant="h6" gutterBottom>
        Assets
      </Typography>
    </Grid>

    {assetFields.map((field, index) => (
      <Grid container key={field.id} spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ControlledTextField
            label="Asset Label"
            fullWidth
            control={control}
            name={`assets.${index}.label`}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ControlledTextField
            label="Asset Name"
            fullWidth
            control={control}
            name={`assets.${index}.name`}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => removeAsset(index)}
            startIcon={<Delete />}
            fullWidth
          >
            Remove
          </Button>
        </Grid>
      </Grid>
    ))}

    <Grid size={12}>
      <Button
        variant="outlined"
        onClick={() => appendAsset({ label: '', name: '' })}
        startIcon={<Add />}
      >
        Add Asset
      </Button>
    </Grid>
  </Grid>
)

//Review Step #5 -----------------------------------------------
//explicit return due to processing the sections data in the component
const ReviewStep: React.FC<{
  watch: any
}> = ({ watch }) => {
  const formData = watch()

  // Review Sections - to send to review component for rendering
  const sections = [
    {
      title: "Location Information",
      items: formData.locationMode === 'new' ? [
        { label: "Mode", value: "Create New Location" },
        { label: "Name", value: formData.location?.name },
        { label: "Release Status", value: formData.location?.release_status },
        { label: "Coordinates", value: formData.location?.point },
        { label: "Notes", value: formData.location?.notes || 'None' }
      ] : [
        { label: "Mode", value: "Use Existing Location" },
        { label: "Location ID", value: formData.selectedLocationId }
      ]
    },
    {
      title: "Well Information",
      items: [
        { label: "Name", value: formData.well?.name },
        { label: "Type", value: formData.well?.well_type },
        { label: "Well Depth", value: formData.well?.well_depth ? `${formData.well.well_depth} ft` : '' },
        { label: "Hole Depth", value: formData.well?.hole_depth ? `${formData.well.hole_depth} ft` : '' },
        { label: "Notes", value: formData.well?.notes || 'None' }
      ]
    },
    {
      title: `Contacts (${formData.contacts?.length || 0})`,
      items: [],
      groupedItems: formData.contacts?.map((contact, index) => [
        { label: `Contact ${index + 1} - Name`, value: contact.name },
        { label: `Contact ${index + 1} - Role`, value: contact.role },
        { label: `Emails`, value: `${contact.emails?.length || 0} email(s)` },
        { label: `Phones`, value: `${contact.phones?.length || 0} phone(s)` },
        { label: `Addresses`, value: `${contact.addresses?.length || 0} address(es)` }
      ]) || []
    },
    {
      title: `Assets (${formData.assets?.length || 0})`,
      items: formData.assets?.map((asset) => ({
        label: `Asset`,
        value: `${asset.label || 'Not specified'} - ${asset.name || 'Not specified'}`
      })) || []
    }
  ]

  return (
    <FormReview
      title="Review Your Information"
      description="Please review all the information below before submitting. You can go back to any step to make changes."
      sections={sections}
    />
  )
} 