import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { IWellThing } from '@/interfaces/dataforge/IThing'

export const WellThingCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<IWellThing, HttpError, Nullable<IWellThing>>()

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
