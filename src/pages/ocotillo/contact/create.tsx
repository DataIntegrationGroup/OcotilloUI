import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useState } from 'react'

import { Nullable } from '../../../interfaces'
import { IContact } from '@/interfaces/ocotillo/IContact'
import { IThing } from '@/interfaces/ocotillo/IThing'
import { CreateEditContact } from '@/components/form/contact/CreateEditContact'

export const ContactCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<IContact, HttpError, Nullable<IContact>>()

  const [thingValue, setThingValue] = useState<IThing | null>(null)

  const { autocompleteProps } = useAutocomplete<IThing>({
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
            rules={{ required: 'This field is required' }}
            render={({ field }) => (
              <Autocomplete
                {...autocompleteProps}
                value={thingValue}
                onChange={(_, newValue) => {
                  setThingValue(newValue)
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
