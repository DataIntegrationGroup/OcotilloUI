import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { IWellScreen } from '@/interfaces/ocotillo/IWellScreen'
import { CreateEditWellScreen } from '@/components/form/thing/CreateEditWellScreen'
import { Controller } from 'react-hook-form'
import { Autocomplete } from '@mui/material'
import { useState } from 'react'
import Grid from '@mui/material/Grid2'
import { TextField } from '@mui/material'
import { IThing } from '@/interfaces/ocotillo/IThing'

export const WellScreenCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    setValue,
    formState: { errors },
  } = useForm<IWellScreen, HttpError, Nullable<IWellScreen>>()

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
          <CreateEditWellScreen
            control={control}
            errors={errors}
          />
        </Grid>
      </Grid>
    </Create>
  )
}
