import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm } from '@refinedev/react-hook-form'

import { Controller } from 'react-hook-form'

import { Nullable } from '../../../interfaces'
import { IContact } from '@/interfaces/dataforge/IContact'
import { IThing } from '@/interfaces/dataforge/IThing'
import { useState } from 'react'

export const ContactCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<IContact, HttpError, Nullable<IContact>>()

  const [thingValue, setThingValue] = useState<IThing | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const { autocompleteProps } = useAutocomplete<IThing>({
    resource: 'thing',
    dataProviderName: 'dataforge',
  })

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('name', {
            required: 'This field is required',
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          autoFocus
        />

        <Controller
          name="role"
          control={control}
          rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              //todo: get roles from API
              options={['Owner', 'Manager', 'Operator']}
              value={role}
              onChange={(_, newValue) => {
                setRole(newValue)
                field.onChange(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Role"
                  margin="normal"
                  error={!!errors.role}
                  helperText={errors.role?.message}
                />
              )}
            />
          )}
        />
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
                />
              )}
            />
          )}
        />
      </Box>
    </Create>
  )
}
