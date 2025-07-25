import type { HttpError } from '@refinedev/core'
import { Create, DateField } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { ISensor } from '@/interfaces/dataforge/ISensor'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'

export const SensorCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<ISensor, HttpError, Nullable<ISensor>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          autoFocus
        />
        <TextField
          {...register('model')}
          error={!!errors.model}
          helperText={errors.model?.message}
          margin="normal"
          fullWidth
          label="Model"
          name="model"
        />
        <TextField
          {...register('serial_no')}
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
          render={({ field, fieldState }) => (
            <DatePicker
              {...field}
              label="Date Installed"
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
          render={({ field, fieldState }) => (
            <DatePicker
              {...field}
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
          {...register('notes')}
          error={!!errors.notes}
          helperText={errors.notes?.message}
          margin="normal"
          fullWidth
          label="Notes"
          name="notes"
          multiline
          rows={4}
        />
      </Box>
    </Create>
  )
}
