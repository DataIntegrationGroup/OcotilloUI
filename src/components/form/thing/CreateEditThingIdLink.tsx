import { SelectThingComponent } from '@/components/form/thing/SelectThingComponent'
import TextField from '@mui/material/TextField'
import { ControlledSelectField } from '@/components'
import Box from '@mui/material/Box'
import { Control, FieldErrors } from 'react-hook-form'

interface CreateEditThingIdLinkProps {
  control: Control<any>
  errors: FieldErrors<any>
  watch: any
  register: any
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditThingIdLink: React.FC<CreateEditThingIdLinkProps> = ({
  control,
  errors,
  watch,
  register,
  mode = 'standalone',
  fieldPrefix = '',
}) => {
  return (
    <Box
      component="form"
      sx={{ display: 'flex', flexDirection: 'column' }}
      autoComplete="off"
    >
      <SelectThingComponent
        control={control}
        errors={errors}
        watch={watch}
        thing_type={'water well'}
      />

      <TextField
        {...register('alternate_id')}
        error={!!errors.alternate_id}
        helperText={errors.alternate_id?.message}
        margin="normal"
        fullWidth
        label="Alternate ID"
        name="alternate_id"
        autoFocus
        required
      />
      <ControlledSelectField
        required
        control={control}
        name={'relation'}
        label={'Relation'}
        options={[
          { value: 'same_as', label: 'Same As' },
          { value: 'related_to', label: 'Related To' },
        ]}
        defaultValue="same_as"
      />
      <TextField
        {...register('alternate_organization')}
        error={!!errors.alternate_organization}
        helperText={errors.alternate_organization?.message}
        margin="normal"
        fullWidth
        label="Alternate Organization"
        name="alternate_organization"
        required
      />
      {/*<TextField*/}
      {/*  {...register('serial_no')}*/}
      {/*  error={!!errors.serial_no}*/}
      {/*  helperText={errors.serial_no?.message}*/}
      {/*  margin="normal"*/}
      {/*  fullWidth*/}
      {/*  label="Serial No"*/}
      {/*  name="serial_no"*/}
      {/*/>*/}
      {/*<Controller*/}
      {/*  name="date_installed"*/}
      {/*  control={control}*/}
      {/*  render={({ field, fieldState }) => (*/}
      {/*    <DatePicker*/}
      {/*      {...field}*/}
      {/*      label="Date Installed"*/}
      {/*      slotProps={{*/}
      {/*        textField: {*/}
      {/*          margin: 'normal',*/}
      {/*          fullWidth: true,*/}
      {/*          error: !!errors.date_installed,*/}
      {/*          helperText: errors.date_installed?.message,*/}
      {/*        },*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  )}*/}
      {/*/>*/}
      {/*<Controller*/}
      {/*  name="date_removed"*/}
      {/*  control={control}*/}
      {/*  render={({ field, fieldState }) => (*/}
      {/*    <DatePicker*/}
      {/*      {...field}*/}
      {/*      label="Date Removed"*/}
      {/*      slotProps={{*/}
      {/*        textField: {*/}
      {/*          margin: 'normal',*/}
      {/*          fullWidth: true,*/}
      {/*          error: !!errors.date_removed,*/}
      {/*          helperText: errors.date_removed?.message,*/}
      {/*        },*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  )}*/}
      {/*/>*/}
      {/*<TextField*/}
      {/*  {...register('notes')}*/}
      {/*  error={!!errors.notes}*/}
      {/*  helperText={errors.notes?.message}*/}
      {/*  margin="normal"*/}
      {/*  fullWidth*/}
      {/*  label="Notes"*/}
      {/*  name="notes"*/}
      {/*  multiline*/}
      {/*  rows={4}*/}
      {/*/>*/}
    </Box>
  )
}
