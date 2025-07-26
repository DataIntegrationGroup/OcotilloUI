import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { ISensor } from '@/interfaces/dataforge/ISensor'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'

export const SensorEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    formState: { errors },
  } = useForm<ISensor, HttpError, Nullable<ISensor>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('name', {})}
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          autoFocus
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register('model', {})}
          error={!!errors.model}
          helperText={errors.model?.message}
          margin="normal"
          fullWidth
          label="Model"
          name="model"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register('serial_no', {})}
          error={!!errors.serial_no}
          helperText={errors.serial_no?.message}
          margin="normal"
          fullWidth
          label="Serial No"
          name="serial_no"
        />
        <Controller
          name="date_installed"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Date Installed"
              value={field.value ? dayjs(field.value) : null}
              onChange={val => field.onChange(val ? val.toISOString() : null)}
              slotProps={{
                textField: {
                  margin: "normal",
                  fullWidth: true,
                  error: !!errors.date_installed,
                  helperText: errors.date_installed?.message,
                },
              }}
            />
          )}
        />
        <Controller
          name="date_removed"
          control={control}
          render={({ field }) => (
            <DatePicker
              value={field.value ? dayjs(field.value) : null}
              onChange={val => field.onChange(val ? val.toISOString() : null)}
              label="Date Removed"
              slotProps={{
                textField: {
                  margin: "normal",
                  fullWidth: true,
                  error: !!errors.date_removed,
                  helperText: errors.date_removed?.message,
                },
              }}
            />
          )}
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
