import React, { useState } from 'react'
import { useForm } from '@refinedev/react-hook-form'
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
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Add, Delete } from '@mui/icons-material'
import {
  ControlledTextField,
  ControlledSelectField,
  ControlledCheckbox,
  ControlledEmailField,
  ControlledMapboxAddressAutocomplete,
} from '@/components'
import { IWellInventoryForm } from '@/interfaces/dataforge/IWellInventoryForm'
import { ILocation } from '@/interfaces/dataforge/ILocation'
import { WellInventorySchema, SchemaDefaults } from './well_inventory.schema'
import { createWellInventoryForm } from './well_inventory.service'

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
    formState: { errors },
  } = useForm<IWellInventoryForm>({
    defaultValues: SchemaDefaults,
    resolver: yupResolver(WellInventorySchema),
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
          <Grid container spacing={3}>
            {/* Location Section */}
            <Grid size={12}>
              <Typography variant="h5" gutterBottom>
                Location Information
              </Typography>
            </Grid>

            {/* Location Mode Selection */}
            <Grid size={12}>
              <Card elevation={1} sx={{ p: 2 }}>
                <RadioGroup
                  value={watch('locationMode')}
                  onChange={(e) => {
                    setValue('locationMode', e.target.value as 'new' | 'existing')
                    // Clear the other field when switching modes
                    if (e.target.value === 'existing') {
                      setValue('location.name', '')
                      setValue('location.notes', '')
                      setValue('location.point', '')
                      setValue('location.release_status', 'public')
                    } else {
                      setValue('selectedLocationId', undefined)
                    }
                  }}
                >
                  <FormControlLabel
                    value="new"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Create a new location
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add location details for this well
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="existing"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Use existing location
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Select from database
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Card>
            </Grid>

            {/* Existing Location Selector */}
            {watch('locationMode') === 'existing' && (
              <>
                <Grid size={12}>
                  <Controller
                    name="selectedLocationId"
                    control={control}
                    rules={{ required: 'Please select a location' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        {...locationAutocompleteProps}
                        value={locationAutocompleteProps.options.find(option => option.id === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue?.id || null)
                        }}
                        getOptionKey={(option) => option.id}
                        getOptionLabel={(option) => option.name || ''}
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
              </>
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
                    placeholder='POINT (-106.5 35.1)'
                    helperText="Enter coordinates in POINT (X Y) format"
                    required
                  />
                </Grid>
                
                <Grid size={12}>
                  <ControlledTextField
                    label="Location Notes"
                    fullWidth
                    multiline
                    rows={3}
                    control={control}
                    name="location.notes"
                  />
                </Grid>
              </>
            )}

            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Well Section */}
            <Grid size={12}>
              <Typography variant="h5" gutterBottom>
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
                  { value: 'draft', label: 'Draft' }
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
                rows={3}
                control={control}
                name="well.notes"
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Contacts Section */}
            <Grid size={12}>
              <Typography variant="h5" gutterBottom>
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
                      { value: 'Owner', label: 'Owner' }
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
                            { value: 'Primary', label: 'Primary' }
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
                            { value: 'Primary', label: 'Primary' }
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
                            { value: 'Primary', label: 'Primary' }
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

            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Assets Section */}
            <Grid size={12}>
              <Typography variant="h5" gutterBottom>
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

            {/* Form Actions */}
            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleReset}
                  disabled={isPending}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isPending}
                >
                  {isPending ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
} 