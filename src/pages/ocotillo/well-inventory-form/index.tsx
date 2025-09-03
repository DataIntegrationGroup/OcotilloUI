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
  Typography,
  Autocomplete,
  TextField,
  Card,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Add, Delete } from '@mui/icons-material'
import { ControlledTextField, ControlledRadioFormSelection } from '@/components'
import { IWellInventoryForm } from '@/interfaces/ocotillo/IWellInventoryForm'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { createWellInventoryForm } from '@/pages/ocotillo/well-inventory-form/well_inventory.service'
import { CreateEditLocation } from '@/components/form/location/CreateEditLocation'
import { CreateEditWell } from '@/components/form/thing/CreateEditWell'
import { CreateEditContact } from '@/components/form/contact/CreateEditContact'
import { CreateEditAsset } from '@/components/form/asset/CreateEditAsset'
import { FormReview } from '@/components/form/stepper/FormReview'
import { FormStepper } from '@/components/form/stepper/FormStepper'

import {
  wellInventoryStepSchemas,
  SchemaDefaults,
} from './well_inventory.schema'
import { CreateEditWellScreen } from '@/components/form/thing/CreateEditWellScreen'
import { useNavigation } from '@refinedev/core'

export const WellInventoryForm: React.FC = () => {
  const { open, close } = useNotification()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { push } = useNavigation()

  const { autocompleteProps: locationAutocompleteProps } =
    useAutocomplete<ILocation>({
      resource: 'ocotillo.location',
      dataProviderName: 'ocotillo',
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
    setError,
    register,
    watch,
    trigger,
    formState: { errors },
    steps: { currentStep, gotoStep },
    refineCore: { onFinish },
  } = useStepsForm<IWellInventoryForm>({
    defaultValues: SchemaDefaults,
    resolver: (data, ctx, opts) =>
      yupResolver(wellInventoryStepSchemas[currentStep])(data, ctx, opts),
    stepsProps: {
      isBackValidate: false,
    },
  })

  // ------------------------------------------------------------
  // Step Labels with Descriptions
  // ------------------------------------------------------------

  const steps = [
    {
      label: 'Location Information',
      description: 'Define the geographic location for the well'
    },
    {
      label: 'Well Information',
      description: 'Enter well details including depth, diameter, and construction'
    },
    {
      label: 'Well Screens',
      description: 'Configure well screen intervals and specifications'
    },
    {
      label: 'Contacts',
      description: 'Add responsible parties and contact information'
    },
    {
      label: 'Assets',
      description: 'Upload documents, photos, and related files'
    },
    {
      label: 'Review & Submit'
    },
  ]

  // ------------------------------------------------------------
  // Field Arrays
  // ------------------------------------------------------------

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'contacts',
  })

  const {
    fields: assetFields,
    append: appendAsset,
    remove: removeAsset,
  } = useFieldArray({
    control,
    name: 'assets',
  })

  const {
    fields: wellScreenFields,
    append: appendWellScreen,
    remove: removeWellScreen,
  } = useFieldArray({
    control,
    name: 'wellScreens',
  })

  // ------------------------------------------------------------
  // Form Submission Mutation
  // ------------------------------------------------------------

  // state for form submission for after submit page display
  const [submissionResult, setSubmissionResult] = useState<'success' | 'error' | null>(null)
  //state to handle created well id for show navigation
  const [createdWellId, setCreatedWellId] = useState<number | null>(null)

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createWellInventoryForm,
    onMutate: () => {
      open?.({
        key: 'well-inventory-submission',
        type: 'progress',
        message: 'Submitting Well Inventory Form...',
      })
    },
    onSuccess: (data) => {
      close?.('well-inventory-submission')
      open?.({
        type: 'success',
        message: 'Form Submitted Successfully!',
        description: 'Your well inventory form has been submitted.',
      })
      setSubmissionResult('success')
      setCreatedWellId(data.well.data.id as number)
    },
    onError: (error) => {
      close?.('well-inventory-submission')
      open?.({
        type: 'error',
        message: 'Failed to Submit Form',
        description: 'Please check your input and try again later.',
      })
      setSubmissionResult('error')
      console.error('Form submission error:', error)
    },
  })

  // ------------------------------------------------------------
  // Form Handlers
  // ------------------------------------------------------------

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
    const isValid = await trigger()
    if (isValid) gotoStep(currentStep + 1)
  }

  const handleBack = () => {
    gotoStep(currentStep - 1)
  }

  //step click navigation
  const handleStepClick = (stepIndex: number) => {
    gotoStep(stepIndex)
  }

  //handler for going back to beginning of form after successful submission
  const handleCreateAnother = () => {
    setSubmissionResult(null)
    reset(SchemaDefaults)
    gotoStep(0)
  }

  // ------------------------------------------------------------
  // Render Step Content
  // ------------------------------------------------------------

  const renderFormByStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <LocationStep
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
            locationAutocompleteProps={locationAutocompleteProps}
          />
        )
      case 1:
        return <WellStep control={control} watch={watch} errors={errors} />
      case 2:
        return (
          <WellScreensStep
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
            wellScreenFields={wellScreenFields}
            appendWellScreen={appendWellScreen}
            removeWellScreen={removeWellScreen}
          />
        )
      case 3:
        return (
          <ContactsStep
            control={control}
            watch={watch}
            setValue={setValue}
            errors={errors}
            contactFields={contactFields}
            appendContact={appendContact}
            removeContact={removeContact}
          />
        )
      case 4:
        return (
          <AssetsStep
            control={control}
            watch={watch}
            setValue={setValue}
            setError={setError}
            register={register}
            errors={errors}
            assetFields={assetFields}
            appendAsset={appendAsset}
            removeAsset={removeAsset}
          />
        )
      case 5:
        return <ReviewStep watch={watch} />
      default:
        return null
    }
  }

  // ------------------------------------------------------------
  // MAIN STEPPER COMPONENT RETURN
  // ------------------------------------------------------------

  return (
    <>
    {submissionResult ? (
      // Show result page when there's a submission result
      <Card sx={{ p: 4, textAlign: 'center' }}>
          {submissionResult === 'success' ? (
            <>
              <Typography variant="h4" color="success.main" gutterBottom>
                Well Created Successfully!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your well has been submitted and saved.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleCreateAnother}
                  startIcon={<Add />}
                >
                  Create Another Well
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (createdWellId) {
                      push(`/ocotillo/well/show/${createdWellId}`)
                    }
                  }}
                  disabled={!createdWellId}
                >
                  View Created Well
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => push('/ocotillo/well')}
                >
                  View All Wells
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h4" color="error.main" gutterBottom>
                Something Went Wrong
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                There was an error submitting your form. Please try again.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => setSubmissionResult(null)}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => push('/ocotillo/well')}
                >
                  Go Back to Wells
                </Button>
              </Box>
            </>
          )}
        </Card>
    ) : (
      <FormStepper
        title="Well Inventory Form"
        description="This form is used to create a new water well in the database."
        steps={steps}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit(handleFormSubmit)}
        onReset={handleReset}
        isSubmitting={isPending}
        onStepClick={handleStepClick}
      >
        {renderFormByStep(currentStep)}
      </FormStepper>
    )}
  </>
  )
}

// ------------------------------------------------------------
//Define Step Components:
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


    {/* Location Mode Selection */}
    <Grid size={12}>
      <Card sx={{ p: 2 }}>
        <ControlledRadioFormSelection
          control={control}
          name="locationMode"
          label=""
          options={[
            {
              value: 'new',
              label: 'Create a new location',
              description: 'Add details for a new point',
            },
            {
              value: 'existing',
              label: 'Select an existing location',
              description: 'Choose from database',
            },
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
              value={
                locationAutocompleteProps.options.find(
                  (option: any) => option.id === field.value
                ) || null
              }
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

    {/*  Well Form ----------------------------------------*/}
    {/*  /components/form/thing/CreateEditWell.tsx */}
    <Grid container spacing={2} sx={{ mt: 3 }}>
      <CreateEditWell
        control={control}
        errors={errors}
        mode="step"
        fieldPrefix="well."
      />
    </Grid>
  </Grid>
)

const WellScreensStep: React.FC<{
  control: any
  watch: any
  setValue: any
  errors: any
  wellScreenFields: any
  appendWellScreen: any
  removeWellScreen: any
}> = ({
  control,
  watch,
  setValue,
  errors,
  wellScreenFields,
  appendWellScreen,
  removeWellScreen,
}) => (
  <Grid container spacing={3}>

    {wellScreenFields.map((field, screenIndex) => (
      <Grid container key={field.id} spacing={2} sx={{ mb: 3 }}>
        <CreateEditWellScreen
          control={control}
          watch={watch}
          setValue={setValue}
          errors={errors}
          mode="step"
          fieldPrefix={`wellScreens.${screenIndex}.`}
          screenIndex={screenIndex}
          onRemoveScreen={removeWellScreen}
          onAddScreen={
            screenIndex === wellScreenFields.length - 1
              ? () =>
                  appendWellScreen({
                    screen_depth_top: null,
                    screen_depth_bottom: null,
                    screen_description: '',
                    release_status: 'draft',
                  })
              : undefined
          }
          canRemoveScreen={wellScreenFields.length > 1}
          totalScreens={wellScreenFields.length}
        />
      </Grid>
    ))}

    {/* Show Add Screen button when no screens exist */}
    {wellScreenFields.length === 0 && (
      <Grid size={12}>
        <Button
          variant="outlined"
          onClick={() =>
            appendWellScreen({
              screen_depth_top: null,
              screen_depth_bottom: null,
              screen_description: '',
              release_status: 'draft',
            })
          }
          startIcon={<Add />}
        >
          Add Well Screen
        </Button>
      </Grid>
    )}
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
}> = ({
  control,
  watch,
  setValue,
  errors,
  contactFields,
  appendContact,
  removeContact,
}) => (
  <Grid container spacing={3}>

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
          onAddContact={
            contactIndex === contactFields.length - 1
              ? () =>
                  appendContact({
                    name: '',
                    role: 'contact',
                    emails: [],
                    phones: [],
                    addresses: [],
                    release_status: 'private',
                  })
              : undefined
          }
          canRemoveContact={contactFields.length > 1}
          totalContacts={contactFields.length}
        />
      </Grid>
    ))}
  </Grid>
)

//Assets Step #4 -----------------------------------------------
/**
 * @TODO Link asset to a well via thing_id in future API changes
 * @TODO Create a new component that allows for multi-file selection without immediate upload, and
 * change the asset step to use this new component
 * @TODO change the well inventory form to only upload new asset on form submit, not on file selection
 */
const AssetsStep: React.FC<{
  control: any
  watch: any
  setValue: any
  setError: any
  register: any
  errors: any
  assetFields: any
  appendAsset: any
  removeAsset: any
}> = ({
  control,
  watch,
  setValue,
  setError,
  register,
  errors,
  assetFields,
  appendAsset,
  removeAsset,
}) => (
  <Grid container spacing={3}>

    {assetFields.map((field, index) => (
      <Grid container key={field.id} spacing={2} sx={{ mb: 3 }}>
        <CreateEditAsset
          control={control}
          watch={watch}
          setValue={setValue}
          setError={setError}
          register={register}
          errors={errors}
          mode="step"
          fieldPrefix={`assets.${index}.`}
          assetIndex={index}
          onRemoveAsset={removeAsset}
          onAddAsset={(asset) => {
            appendAsset({
              ...asset,
              thing_id: null,
              /**
               * @TODO Link asset to a well via thing_id in future API changes
               */
              storage_path: '',
              mime_type: '',
              size: 0,
              url: '',
              release_status: 'draft',
            })
          }}
          canRemoveAsset={assetFields.length >= 1}
          totalAssets={assetFields.length}
        />
      </Grid>
    ))}

    {/* Show Add Asset button when no assets exist */}
    {assetFields.length === 0 && (
      <Grid size={12}>
        <Button
          variant="outlined"
          onClick={() =>
            appendAsset({
              label: '',
              name: '',
              thing_id: null,
              /**
               * @TODO Link asset to a well via thing_id in future API changes
               */
              file: null,
              storage_path: '',
              mime_type: '',
              size: 0,
              url: '',
              release_status: 'draft',
            })
          }
          startIcon={<Add />}
        >
          Add Asset
        </Button>
      </Grid>
    )}
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
      title: 'Location Information',
      items:
        formData.locationMode === 'new'
          ? [
              { label: 'Mode', value: 'Create New Location' },
              { label: 'Name', value: formData.location?.name },
              {
                label: 'Release Status',
                value: formData.location?.release_status,
              },
              { label: 'Coordinates', value: formData.location?.point },
              { label: 'Notes', value: formData.location?.notes || 'None' },
            ]
          : [
              { label: 'Mode', value: 'Use Existing Location' },
              { label: 'Location ID', value: formData.selectedLocationId },
            ],
    },
    {
      title: 'Well Information',
      items: [
        { label: 'Name', value: formData.well?.name },
        { label: 'Type', value: formData.well?.well_type },
        {
          label: 'Well Depth',
          value: formData.well?.well_depth
            ? `${formData.well.well_depth} ft`
            : '',
        },
        {
          label: 'Hole Depth',
          value: formData.well?.hole_depth
            ? `${formData.well.hole_depth} ft`
            : '',
        },
        { label: 'Notes', value: formData.well?.notes || 'None' },
        { label: 'Release Status', value: formData.well?.release_status },
      ],
    },
    {
      title: `Well Screens (${formData.wellScreens?.length || 0})`,
      items:
        formData.wellScreens?.map((screen, index) => ({
          label: `Screen ${index + 1}`,
          value: `Top: ${screen.screen_depth_top || 'N/A'} ft, Bottom: ${screen.screen_depth_bottom || 'N/A'} ft, Description: ${screen.screen_description || 'None'}, Release Status: ${screen.release_status || 'None'}`,
        })) || [],
    },
    {
      title: `Contacts (${formData.contacts?.length || 0})`,
      items: [],
      groupedItems:
        formData.contacts?.map((contact, index) => [
          { label: `Contact ${index + 1} - Name`, value: contact.name },
          { label: `Contact ${index + 1} - Role`, value: contact.role },
          { label: `Emails`, value: `${contact.emails?.length || 0} email(s)` },
          { label: `Phones`, value: `${contact.phones?.length || 0} phone(s)` },
          {
            label: `Addresses`,
            value: `${contact.addresses?.length || 0} address(es)`,
          },
          { label: 'Release Status', value: contact.release_status },
        ]) || [],
    },
    {
      title: `Assets (${formData.assets?.length || 0})`,
      items:
        formData.assets?.map((asset, index) => ({
          label: `Asset ${index + 1}`,
          value: `${asset.label || 'Not specified'} - ${asset.name || 'Not specified'}`,
          release_status: asset.release_status,
        })) || [],
    },
  ]

  return (
    <FormReview
      title=""
      description="Please review all the information below before submitting. You can go back to any step to make changes by clicking on the step label."
      sections={sections}
    />
  )
}
