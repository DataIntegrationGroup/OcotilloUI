import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { IWellThing } from '@/interfaces/dataforge/IThing'

export const WellThingEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    formState: { errors },
  } = useForm<IWellThing, HttpError, Nullable<IWellThing>>()

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
          {...register('well_depth', {})}
          // disabled
          error={!!errors.well_depth}
          helperText={errors.well_depth?.message}
          margin="normal"
          fullWidth
          label="Well Depth (ft)"
          name="well_depth"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register('hole_depth', {})}
          // disabled
          error={!!errors.hole_depth}
          helperText={errors.hole_depth?.message}
          margin="normal"
          fullWidth
          label="Hole Depth (ft)"
          name="hole_depth"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Edit>
  )
}
