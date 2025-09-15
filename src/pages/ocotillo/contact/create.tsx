import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Nullable } from '../../../interfaces'
import { zodResolver } from '@hookform/resolvers/zod'
import { zCreateContact } from '@/generated/zod.gen'
import { CreateContact } from '@/generated/types.gen'
import { ThingResponse } from '@/generated/types.gen'
import { CreateEditContact } from '@/components/form/contact/CreateEditContact'

export const ContactCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<CreateContact, HttpError, Nullable<CreateContact>>({
    resolver: zodResolver(zCreateContact),
    mode: "onSubmit",
  })

  const { autocompleteProps } = useAutocomplete<ThingResponse>({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Controller
            name="thing_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...autocompleteProps}
                value={
                  autocompleteProps.options.find(
                    (option) => option.id === field.value
                  ) || null
                }
                onChange={(_, newValue) => {
                  field.onChange(newValue?.id || null)
                }}
                getOptionKey={(option) => option.id}
                getOptionLabel={(option) => option.name || ''}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Thing"
                    margin="normal"
                    error={!!errors.thing_id}
                    helperText={errors.thing_id?.message}
                    required
                  />
                )}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <CreateEditContact
            control={control}
            errors={errors}
            mode="standalone"
            showDynamicArrays={true}
          />
        </Grid>
      </Grid>
    </Create>
  )
}
