import { SelectThingComponent } from '@/components/form/thing/SelectThingComponent'
import TextField from '@mui/material/TextField'
import { ControlledSelectField } from '@/components'
import Box from '@mui/material/Box'
import type {
  Control,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormWatch,
} from 'react-hook-form'

interface CreateEditThingIdLinkProps<T extends FieldValues = FieldValues> {
  control: Control<T>
  errors: FieldErrors<T>
  watch: UseFormWatch<T>
  register: UseFormRegister<T>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditThingIdLink = <T extends FieldValues>({
  control,
  errors,
  watch,
  register,
  mode = 'standalone',
  fieldPrefix = '',
}: CreateEditThingIdLinkProps<T>) => {
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
        {...register('alternate_id' as Path<T>)}
        error={!!errors.alternate_id}
        helperText={(errors.alternate_id as FieldError | undefined)?.message}
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
        {...register('alternate_organization' as Path<T>)}
        error={!!errors.alternate_organization}
        helperText={
          (errors.alternate_organization as FieldError | undefined)?.message
        }
        margin="normal"
        fullWidth
        label="Alternate Organization"
        name="alternate_organization"
        required
      />
    </Box>
  )
}
