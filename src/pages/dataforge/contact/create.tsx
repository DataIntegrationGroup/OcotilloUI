import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm } from '@refinedev/react-hook-form'

import { Controller } from 'react-hook-form'

import type { ILocation } from '../../../interfaces/amp'
import { Nullable } from '../../../interfaces'
import { IContact } from '@/interfaces/dataforge/IContact'

export const ContactCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<IContact, HttpError, Nullable<IContact>>()

  // const { autocompleteProps } = useAutocomplete<ICategory>({
  //   resource: "categories",
  // });

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
        <TextField
          {...register('role', {
            required: 'This field is required',
          })}
          error={!!errors.role}
          helperText={errors.role?.message}
          margin="normal"
          fullWidth
          label="Role"
          name="role"
          autoFocus
        />
        <TextField
          {...register('thing_id', {
            required: 'This field is required',
          })}
          error={!!errors.thing_id}
          helperText={errors.thing_id?.message}
          margin="normal"
          fullWidth
          label="Thing ID"
          name="thing_id"
          autoFocus
          defaultValue={3}
        />
      </Box>
    </Create>
  )
}
