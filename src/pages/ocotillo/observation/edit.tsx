import type { HttpError } from '@refinedev/core'
import { Edit, useAutocomplete } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm } from '@refinedev/react-hook-form'

import { Controller } from 'react-hook-form'

import type { Nullable } from '@/interfaces'
import FormControlLabel from '@mui/material/FormControlLabel'
import { Switch } from '@mui/material'
import { IContact } from '@/interfaces/ocotillo/IContact'

export const ContactEdit: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<IContact, HttpError, Nullable<IContact>>()

  // const { autocompleteProps } = useAutocomplete<ICategory>({
  //   resource: "categories",
  //   defaultValue: queryResult?.data?.data.category.id,
  // });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('name', {
            required: 'This field is required',
          })}
          // disabled
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Edit>
  )
}
