import type { HttpError } from '@refinedev/core'
import { Edit, useAutocomplete } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'
import { Autocomplete, TextField } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'

import type { Nullable } from '@/interfaces'
import { IContact } from '@/interfaces/ocotillo/IContact'
import { IThing } from '@/interfaces/ocotillo/IThing'
import { CreateEditContact } from '@/components/form/contact/CreateEditContact'

export const ContactEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    formState: { errors },
    watch,
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
  /**
   * @TODO this doesn't seems like the best method to get the thing id into the autocomplete
   * @refactor
   */
  useEffect(() => {
    if (
      queryResult?.data?.data?.things &&
      queryResult.data.data.things.length > 0
    ) {
      const thing = queryResult.data.data.things[0]
      setThingValue(thing)
    }
  }, [queryResult?.data?.data?.things])

  return (
    <Edit saveButtonProps={saveButtonProps}>
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
                onChange={(_, newValue: any) => {
                  setThingValue(newValue)
                  field.onChange(newValue?.id || null)
                }}
                getOptionKey={(option: any) => option.id}
                getOptionLabel={(option: any) => option.name || ''}
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
    </Edit>
  )
}
