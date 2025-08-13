import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { ISpring, IWell } from '@/interfaces/ocotillo/IThing'
import Autocomplete from '@mui/material/Autocomplete'
import { Controller } from 'react-hook-form'
import { useState } from 'react'
import { CreateEditWell } from '@/components/form/thing/CreateEditWell'

export const SpringCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<IWell, HttpError, Nullable<ISpring>>()

  // const { autocompleteProps } = useAutocomplete<ICategory>({
  //   resource: "categories",
  // });
  const [springType, setSpringType] = useState<string | null>(null)

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
          name="spring_type"
          control={control}
          rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              //todo: get spring_types from API
              options={[
                'Artesian',
                'Ephemeral',
                'Perennial',
                'Thermal',
                'Mineral',
              ]}
              value={springType}
              onChange={(_, newValue) => {
                setSpringType(newValue)
                field.onChange(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Spring Type"
                  margin="normal"
                  error={!!errors.spring_type}
                  helperText={errors.spring_type?.message}
                />
              )}
            />
          )}
        />
        <TextField
          {...register('location_id')}
          error={!!errors.location_id}
          helperText={errors.location_id?.message}
          margin="normal"
          fullWidth
          label="location_id"
          name="location_id"
          autoFocus
        />
      </Box>
    </Create>
  )
}

export const WellCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<IWell, HttpError, Nullable<IWell>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditWell control={control} errors={errors} mode="standalone" />
    </Create>
  )
}
