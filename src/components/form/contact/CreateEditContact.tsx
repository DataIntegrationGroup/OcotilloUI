import { 
    Control, 
    FieldErrors, 
    UseFormWatch, 
    UseFormSetValue,
    useFieldArray
} from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import { 
    Button, 
    Typography, 
    Box,
    Divider
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import {
  ControlledTextField,
  ControlledSelectField,
} from '@/components'

interface CreateEditContactProps {
  control: Control<any>
  watch?: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
  showDynamicArrays?: boolean
  // Contact-level array management
  contactIndex?: number
  onRemoveContact?: (index: number) => void
  onAddContact?: () => void
  canRemoveContact?: boolean
  totalContacts?: number
}

export const CreateEditContact: React.FC<CreateEditContactProps> = ({
  control,
  watch,
  setValue,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
  showDynamicArrays = false,
  contactIndex,
  onRemoveContact,
  onAddContact,
  canRemoveContact = true,
  totalContacts = 1
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control,
    name: getFieldName('emails'),
  })

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: getFieldName('phones'),
  })

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control,
    name: getFieldName('addresses'),
  })

  return (
    <Grid container spacing={3}>
      {/* Contact Header with canRemoveContact button */}
      {contactIndex !== undefined && (
        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2, gap: 2 }}>
            <Typography variant="h6">Contact {contactIndex + 1}</Typography>
            {onRemoveContact && canRemoveContact && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => onRemoveContact(contactIndex)}
                startIcon={<Delete />}
              >
                Remove Contact
              </Button>
            )}
          </Box>
        </Grid>
      )}

      {/* Basic Contact Information */}
      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Contact Name"
          fullWidth
          control={control}
          name={getFieldName('name')}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Contact Role"
          fullWidth
          control={control}
          name={getFieldName('role')}
          options={[
            { value: 'Owner', label: 'Owner' },
          ]}
          required
        />
      </Grid>

      {/* Dynamic Arrays  */}
      {showDynamicArrays && (
        <>
          {/* Emails Section */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2, gap: 2 }}>
              <Typography variant="h6">Emails</Typography>
              <Button
                startIcon={<Add />}
                onClick={() => appendEmail({ email: '', email_type: 'Primary' })}
                variant="outlined"
                size="small"
              >
                Add Email
              </Button>
            </Box>
            {emailFields.map((emailField, emailIndex) => (
              <Grid container key={emailField.id} spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="Email Address"
                    fullWidth
                    control={control}
                    name={`${getFieldName('emails')}.${emailIndex}.email`}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ControlledSelectField
                    label="Email Type"
                    fullWidth
                    control={control}
                    name={`${getFieldName('emails')}.${emailIndex}.email_type`}
                    options={[
                      { value: 'Primary', label: 'Primary' },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => removeEmail(emailIndex)}
                    variant="outlined"
                    color="error"
                    fullWidth
                  >
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}
          </Grid>

          {/* Phones Section */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2, gap: 2 }}>
              <Typography variant="h6">Phone Numbers</Typography>
              <Button
                startIcon={<Add />}
                onClick={() => appendPhone({ 
                  country_code: '+1', 
                  phone_number: '', 
                  phone_type: 'Primary' 
                })}
                variant="outlined"
                size="small"
              >
                Add Phone
              </Button>
            </Box>
            {phoneFields.map((phoneField, phoneIndex) => (
              <Grid container key={phoneField.id} spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 2 }}>
                  <ControlledSelectField
                    label="Country Code"
                    fullWidth
                    control={control}
                    name={`${getFieldName('phones')}.${phoneIndex}.country_code`}
                    options={[
                      { value: '+1', label: 'US (+1)' },
                    ]}
                    defaultValue="+1"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ControlledTextField
                    label="Phone Number"
                    fullWidth
                    control={control}
                    name={`${getFieldName('phones')}.${phoneIndex}.phone_number`}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ControlledSelectField
                    label="Phone Type"
                    fullWidth
                    control={control}
                    name={`${getFieldName('phones')}.${phoneIndex}.phone_type`}
                    options={[
                      { value: 'Primary', label: 'Primary' },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => removePhone(phoneIndex)}
                    variant="outlined"
                    color="error"
                    fullWidth
                  >
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}
          </Grid>

          {/* Addresses Section */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2, gap: 2 }}>
              <Typography variant="h6">Addresses</Typography>
              <Button
                startIcon={<Add />}
                onClick={() => appendAddress({ 
                  address_line_1: '', 
                  address_line_2: '', 
                  city: '', 
                  state: '', 
                  postal_code: '', 
                  address_type: 'Primary' 
                })}
                variant="outlined"
                size="small"
              >
                Add Address
              </Button>
            </Box>
            {addressFields.map((addressField, addressIndex) => (
              <Grid container key={addressField.id} spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="Address Line 1"
                    fullWidth
                    control={control}
                    name={`${getFieldName('addresses')}.${addressIndex}.address_line_1`}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <ControlledSelectField
                    label="Address Type"
                    fullWidth
                    control={control}
                    name={`${getFieldName('addresses')}.${addressIndex}.address_type`}
                    options={[
                      { value: 'Primary', label: 'Primary' },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => removeAddress(addressIndex)}
                    variant="outlined"
                    color="error"
                    fullWidth
                  >
                    Remove
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="Address Line 2"
                    fullWidth
                    control={control}
                    name={`${getFieldName('addresses')}.${addressIndex}.address_line_2`}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="City"
                    fullWidth
                    control={control}
                    name={`${getFieldName('addresses')}.${addressIndex}.city`}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="State"
                    fullWidth
                    control={control}
                    name={`${getFieldName('addresses')}.${addressIndex}.state`}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ControlledTextField
                    label="Postal Code"
                    fullWidth
                    control={control}
                    name={`${getFieldName('addresses')}.${addressIndex}.postal_code`}
                    required
                  />
                </Grid>
              </Grid>
            ))}
            <Divider sx={{ my: 2 }} />
          </Grid>
        </>
      )}
      

      {/* Add Contact Button */}
      {onAddContact && (
        <Grid size={12}>
          <Button
            variant="outlined"
            onClick={onAddContact}
            startIcon={<Add />}
          >
            Add Contact
          </Button>
        </Grid>
      )}
    </Grid>
  )
}
