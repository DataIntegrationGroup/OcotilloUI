import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { ISpring, IWell } from '@/interfaces/dataforge/IThing'
import Autocomplete from '@mui/material/Autocomplete'
import { Controller } from 'react-hook-form'
import { useState } from 'react'

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
    register,
    control,
    formState: { errors },
  } = useForm<IWell, HttpError, Nullable<IWell>>()

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
          {...register('location_id')}
          error={!!errors.location_id}
          helperText={errors.location_id?.message}
          margin="normal"
          fullWidth
          label="Location ID"
          name="location_id"
          autoFocus
        />
        <TextField
          {...register('well_depth')}
          error={!!errors.well_depth}
          helperText={errors.well_depth?.message}
          margin="normal"
          fullWidth
          label="Well Depth (ft)"
          name="well_depth"
          autoFocus
        />
        <TextField
          {...register('hole_depth')}
          error={!!errors.hole_depth}
          helperText={errors.hole_depth?.message}
          margin="normal"
          fullWidth
          label="Hole Depth (ft)"
          name="hole_depth"
          autoFocus
        />
      </Box>
    </Create>
  )
}
