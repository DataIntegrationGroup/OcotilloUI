import type { HttpError } from '@refinedev/core'
import { Create, DateField } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import { ISample } from '@/interfaces/dataforge/ISample'

export const SampleCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<ISample, HttpError, Nullable<ISample>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('collection_method')}
          error={!!errors.collection_method}
          helperText={errors.collection_method?.message}
          margin="normal"
          fullWidth
          label="Collection Method"
          name="collection_method"
        />
        <TextField
          {...register('thing_id')}
          error={!!errors.thing_id}
          helperText={errors.thing_id?.message}
          margin="normal"
          fullWidth
          label="Thing ID"
          name="thing_id"
        />
        <Controller
          name="collection_timestamp"
          control={control}
          render={({ field, fieldState }) => (
            <DateTimePicker
              {...field}
              label="Collection Timestamp"
              slotProps={{
                textField: {
                  margin: "normal",
                  fullWidth: true,
                  error: !!errors.collection_timestamp,
                  helperText: errors.collection_timestamp?.message,
                },
              }}
            />
          )}
        />
      </Box>
    </Create>
  )
}
