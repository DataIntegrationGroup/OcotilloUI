import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { ILocation } from '@/interfaces/dataforge/ILocation'

export const LocationEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    formState: { errors },
  } = useForm<ILocation, HttpError, Nullable<ILocation>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('point', {})}
          error={!!errors.point}
          helperText={errors.point?.message}
          margin="normal"
          fullWidth
          label="Point"
          name="point"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register('release_status', {})}
          error={!!errors.release_status}
          helperText={errors.release_status?.message}
          margin="normal"
          fullWidth
          label="Release Status"
          name="release_status"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register('notes', {})}
          error={!!errors.notes}
          helperText={errors.notes?.message}
          margin="normal"
          fullWidth
          label="Notes"
          name="notes"
          multiline
          rows={4}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Edit>
  )
}
