import React, { useState } from 'react'
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
  Switch,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
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
  ControlledSelectField,
  ControlledEmailField,
  ControlledMapboxAddressAutocomplete,
  ControlledRadioFormSelection,
} from '@/components'
import { IWellInventoryForm } from '@/interfaces/dataforge/IWellInventoryForm'
import { ILocation } from '@/interfaces/dataforge/ILocation'
import { WellInventorySchema, SchemaDefaults } from './well_inventory.schema'
import { createWellInventoryForm } from './well_inventory.service'

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
  const [currentStepState, setCurrentStepState] = useState(0)

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
    resolver: yupResolver(WellInventorySchema),
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
      setCurrentStepState(0) // Reset to first step
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
    setCurrentStepState(0)
  }

  const handleNext = async () => {
    console.log('Current step:', currentStep)
    console.log('Current form values:', watch())
    
    // Validate only the current step
    let isValid = false
    
    switch (currentStepState) {
      case 0: // Location step
        const locationMode = watch('locationMode')
        if (locationMode === 'existing') {
          isValid = await trigger(['locationMode', 'selectedLocationId'])
        } else {
          isValid = await trigger(['locationMode', 'location.name', 'location.point', 'location.release_status'])
        }
        break
      case 1: // Well step
        isValid = await trigger(['well.name', 'well.well_type'])
        break
      case 2: // Contacts step
        isValid = await trigger(['contacts'])
        break
      case 3: // Assets step
        isValid = await trigger(['assets'])
        break
      default:
        isValid = true
    }
    if (isValid) {
      setCurrentStepState(currentStepState + 1)
    } else {
      console.error('Validation failed, staying on current step')
    }
  }

  const handleBack = () => {
    setCurrentStepState(currentStepState - 1)
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
          <Stepper activeStep={currentStepState} orientation="vertical" sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {renderStepContent(currentStepState)}
                    {index === currentStepState && (
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
                        {currentStepState < steps.length - 1 ? (
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

// Step Components
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
              description: 'Add location details for this well'
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

    {/* New Location Form */}
    {watch('locationMode') === 'new' && (
      <>
        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledTextField
            label="Location Name"
            fullWidth
            control={control}
            name="location.name"
            required
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledSelectField
            label="Release Status"
            fullWidth
            control={control}
            name="location.release_status"
            options={[
              { value: 'draft', label: 'Draft' }
            ]}
            required
          />
        </Grid>

        <Grid size={12}>
          <ControlledTextField
            label="Location Coordinates POINT (X Y)"
            control={control}
            name="location.point"
            placeholder='POINT(-106.5 35.1)'
            helperText="Enter coordinates in POINT (X Y) format"
            required
          />
        </Grid>

        <Grid size={12}>
          <ControlledTextField
            label="Location Notes"
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            control={control}
            name="location.notes"
          />
        </Grid>
      </>
    )}
  </Grid>
)

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

    <Grid size={{ xs: 12, md: 6 }}>
      <ControlledTextField
        label="Well Name"
        fullWidth
        control={control}
        name="well.name"
        required
      />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <ControlledSelectField
        label="Well Type"
        fullWidth
        control={control}
        name="well.well_type"
        options={[
          { value: 'draft', label: 'Draft' },
        ]}
        required
      />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <ControlledTextField
        label="Well Depth (ft)"
        fullWidth
        type="number"
        control={control}
        name="well.well_depth"
      />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <ControlledTextField
        label="Hole Depth (ft)"
        fullWidth
        type="number"
        control={control}
        name="well.hole_depth"
      />
    </Grid>

    <Grid size={12}>
      <ControlledTextField
        label="Well Notes"
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        control={control}
        name="well.notes"
      />
    </Grid>
  </Grid>
)

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
        <Grid size={12}>
          <Typography variant="h6" gutterBottom>
            Contact {contactIndex + 1}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledTextField
            label="Contact Name"
            fullWidth
            control={control}
            name={`contacts.${contactIndex}.name`}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ControlledSelectField
            label="Contact Role"
            fullWidth
            control={control}
            name={`contacts.${contactIndex}.role`}
            options={[
              { value: 'Owner', label: 'Owner' },
            ]}
            required
          />
        </Grid>

        {/* Contact Emails */}
        <Grid size={12}>
          <Typography variant="subtitle1" gutterBottom>
            Email Addresses
          </Typography>
          {(watch(`contacts.${contactIndex}.emails`) || []).map((emailField, emailIndex) => (
            <Grid container key={emailIndex} spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <ControlledEmailField
                  label="Email"
                  control={control}
                  name={`contacts.${contactIndex}.emails.${emailIndex}.email`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <ControlledSelectField
                  label="Email Type"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.emails.${emailIndex}.email_type`}
                  options={[
                    { value: 'Primary', label: 'Primary' },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const currentEmails = watch(`contacts.${contactIndex}.emails`) || []
                    const newEmails = currentEmails.filter((_, i) => i !== emailIndex)
                    setValue(`contacts.${contactIndex}.emails`, newEmails)
                  }}
                  startIcon={<Delete />}
                  fullWidth
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}
          <Button
            variant="outlined"
            onClick={() => {
              const currentEmails = watch(`contacts.${contactIndex}.emails`) || []
              setValue(`contacts.${contactIndex}.emails`, [
                ...currentEmails,
                { email: '', email_type: 'Primary' }
              ])
            }}
            startIcon={<Add />}
          >
            Add Email
          </Button>
        </Grid>

        {/* Contact Phones */}
        <Grid size={12}>
          <Typography variant="subtitle1" gutterBottom>
            Phone Numbers
          </Typography>
          {(watch(`contacts.${contactIndex}.phones`) || []).map((phoneField, phoneIndex) => (
            <Grid container key={phoneIndex} spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 2 }}>
                <ControlledSelectField
                  label="Country"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.phones.${phoneIndex}.country_code`}
                  options={[
                    { value: '+1', label: 'US (+1)' },
                  ]}
                  defaultValue="+1"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <ControlledTextField
                  label="Phone Number"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.phones.${phoneIndex}.phone_number`}
                  placeholder="555-123-4567"
                  helperText="Enter area code and number (e.g., 555-123-4567)"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <ControlledSelectField
                  label="Phone Type"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.phones.${phoneIndex}.phone_type`}
                  options={[
                    { value: 'Primary', label: 'Primary' },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const currentPhones = watch(`contacts.${contactIndex}.phones`) || []
                    const newPhones = currentPhones.filter((_, i) => i !== phoneIndex)
                    setValue(`contacts.${contactIndex}.phones`, newPhones)
                  }}
                  startIcon={<Delete />}
                  fullWidth
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}
          <Button
            variant="outlined"
            onClick={() => {
              const currentPhones = watch(`contacts.${contactIndex}.phones`) || []
              setValue(`contacts.${contactIndex}.phones`, [
                ...currentPhones,
                { phone_number: '', phone_type: 'Primary', country_code: '+1' }
              ])
            }}
            startIcon={<Add />}
          >
            Add Phone
          </Button>
        </Grid>

        {/* Contact Addresses */}
        <Grid size={12}>
          <Typography variant="subtitle1" gutterBottom>
            Addresses
          </Typography>
          {(watch(`contacts.${contactIndex}.addresses`) || []).map((addressField, addressIndex) => (
            <Grid container key={addressIndex} spacing={2} sx={{ mb: 2 }}>
              <Grid size={12}>
                <ControlledTextField
                  label="Address Line 1"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.addresses.${addressIndex}.address_line_1`}
                />
              </Grid>
              <Grid size={12}>
                <ControlledTextField
                  label="Address Line 2"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.addresses.${addressIndex}.address_line_2`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ControlledTextField
                  label="City"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.addresses.${addressIndex}.city`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ControlledTextField
                  label="State"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.addresses.${addressIndex}.state`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ControlledTextField
                  label="Postal Code"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.addresses.${addressIndex}.postal_code`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <ControlledSelectField
                  label="Address Type"
                  fullWidth
                  control={control}
                  name={`contacts.${contactIndex}.addresses.${addressIndex}.address_type`}
                  options={[
                    { value: 'Primary', label: 'Primary' },
                  ]}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const currentAddresses = watch(`contacts.${contactIndex}.addresses`) || []
                    const newAddresses = currentAddresses.filter((_, i) => i !== addressIndex)
                    setValue(`contacts.${contactIndex}.addresses`, newAddresses)
                  }}
                  startIcon={<Delete />}
                  fullWidth
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}
          <Button
            variant="outlined"
            onClick={() => {
              const currentAddresses = watch(`contacts.${contactIndex}.addresses`) || []
              setValue(`contacts.${contactIndex}.addresses`, [
                ...currentAddresses,
                {
                  address_line_1: '',
                  address_line_2: '',
                  city: '',
                  state: '',
                  postal_code: '',
                  address_type: 'Primary',
                }
              ])
            }}
            startIcon={<Add />}
          >
            Add Address
          </Button>
        </Grid>

        <Grid size={12}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => removeContact(contactIndex)}
            startIcon={<Delete />}
            disabled={contactFields.length === 1}
          >
            Remove Contact
          </Button>
        </Grid>
      </Grid>
    ))}

    <Grid size={12}>
      <Button
        variant="outlined"
        onClick={() => appendContact({
          name: '',
          role: 'contact',
          emails: [],
          phones: [],
          addresses: []
        })}
        startIcon={<Add />}
      >
        Add Contact
      </Button>
    </Grid>
  </Grid>
)

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

const ReviewStep: React.FC<{
  watch: any
}> = ({ watch }) => {
  const formData = watch()

  const ReviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Grid size={12}>
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {title}
        </Typography>
        {children}
      </Paper>
    </Grid>
  )

  const ReviewItem = ({ label, value }: { label: string; value: string | number }) => (
    <Box sx={{ display: 'flex', justifyContent: 'left', py: 0.5, gap: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight="medium">
        {value || 'Not specified'}
      </Typography>
    </Box>
  )

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Typography variant="h6" gutterBottom>
          Review Your Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please review all the information below before submitting. You can go back to any step to make changes.
        </Typography>
      </Grid>

      {/* Location Review */}
      <ReviewSection title="Location Information">
        {formData.locationMode === 'new' ? (
          <Box>
            <ReviewItem label="Mode" value="Create New Location" />
            <ReviewItem label="Name" value={formData.location?.name} />
            <ReviewItem label="Release Status" value={formData.location?.release_status} />
            <ReviewItem label="Coordinates" value={formData.location?.point} />
            <ReviewItem label="Notes" value={formData.location?.notes || 'None'} />
          </Box>
        ) : (
          <Box>
            <ReviewItem label="Mode" value="Use Existing Location" />
            <ReviewItem label="Location ID" value={formData.selectedLocationId} />
          </Box>
        )}
      </ReviewSection>

      {/* Well Review */}
      <ReviewSection title="Well Information">
        <ReviewItem label="Name" value={formData.well?.name} />
        <ReviewItem label="Type" value={formData.well?.well_type} />
        <ReviewItem 
          label="Well Depth" 
          value={formData.well?.well_depth ? `${formData.well.well_depth} ft` : ''} 
        />
        <ReviewItem 
          label="Hole Depth" 
          value={formData.well?.hole_depth ? `${formData.well.hole_depth} ft` : ''} 
        />
        <ReviewItem label="Notes" value={formData.well?.notes || 'None'} />
      </ReviewSection>

      {/* Contacts Review */}
      <ReviewSection title={`Contacts (${formData.contacts?.length || 0})`}>
        {formData.contacts?.map((contact, index) => (
          <Box key={index} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Contact {index + 1}
            </Typography>
            <ReviewItem label="Name" value={contact.name} />
            <ReviewItem label="Role" value={contact.role} />
            <ReviewItem label="Emails" value={`${contact.emails?.length || 0} email(s)`} />
            <ReviewItem label="Phones" value={`${contact.phones?.length || 0} phone(s)`} />
            <ReviewItem label="Addresses" value={`${contact.addresses?.length || 0} address(es)`} />
          </Box>
        ))}
      </ReviewSection>

      {/* Assets Review */}
      <ReviewSection title={`Assets (${formData.assets?.length || 0})`}>
        {formData.assets?.map((asset, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <ReviewItem 
              label={`Asset ${index + 1}`} 
              value={`${asset.label || 'Not specified'} - ${asset.name || 'Not specified'}`} 
            />
          </Box>
        ))}
      </ReviewSection>
    </Grid>
  )
} 