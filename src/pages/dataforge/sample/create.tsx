import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'

import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'

import { ISample } from '@/interfaces/dataforge/ISample'
import { CreateEditSample } from '@/components/form/sample/CreateEditSample'
import { IThing } from '@/interfaces/dataforge/IThing'
import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField } from '@mui/material'
import Grid from '@mui/material/Grid2'

export const SampleCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<ISample, HttpError, Nullable<ISample>>()

  const [thingValue, setThingValue] = useState<IThing | null>(null)

  const { autocompleteProps } = useAutocomplete<IThing>({
    resource: 'thing',
    dataProviderName: 'dataforge',
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
          <CreateEditSample
            control={control}
            errors={errors}
            mode="standalone"
          />
        </Grid>
      </Grid>
    </Create>
  )
}
