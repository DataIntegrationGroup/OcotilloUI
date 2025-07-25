import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { ISample } from '@/interfaces/dataforge/ISample'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'

export const SampleEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    formState: { errors },
  } = useForm<ISample, HttpError, Nullable<ISample>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('collection_method', {})}
          error={!!errors.collection_method}
          helperText={errors.collection_method?.message}
          margin="normal"
          fullWidth
          label="Collection Method"
          name="collection_method"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register('thing_id', {})}
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
          render={({ field }) => (
            <DatePicker
              label="Collection Timestamp"
              value={field.value ? dayjs(field.value) : null}
              onChange={val => field.onChange(val ? val.toISOString() : null)}
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
    </Edit>
  )
}
