import { Box, TextField, TextFieldProps } from '@mui/material'
import { Controller, Control, FieldValues, Path } from 'react-hook-form'

export const ControlledNumberField = <T extends FieldValues>({
  control,
  name,
  label,
  showAsterisk = false,
  warning = false,
  ...textFieldProps
}: {
  control: Control<T>
  name: string
  label: string
  showAsterisk?: boolean
  warning?: boolean
} & Omit<TextFieldProps, 'type' | 'multiline' | 'minRows'>) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...textFieldProps}
          value={field.value ?? ''}
          onChange={(e) => {
            const value = e.target.value
            // Convert to number if not empty, otherwise set to null
            const numValue = value === '' ? null : Number(value)
            field.onChange(numValue)
          }}
          label={
            <>
              {label}
              {showAsterisk ? (
                <>
                  {' '}
                  <Box component="span" sx={{ color: 'error.main' }}>
                    *
                  </Box>
                </>
              ) : null}
            </>
          }
          error={!!fieldState?.error}
          helperText={fieldState?.error?.message || ''}
          type="number"
          fullWidth
          sx={{
            ...(textFieldProps.sx || {}),
            '& .MuiInputLabel-root': {
              color: warning ? 'warning.main' : undefined,
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: warning ? 'warning.dark' : undefined,
            },
            '& .MuiOutlinedInput-root': {
              ...(warning && {
                '& fieldset': {
                  borderColor: 'warning.main',
                },
                '&:hover fieldset': {
                  borderColor: 'warning.dark',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'warning.main',
                },
              }),
            },
          }}
        />
      )}
    />
  )
}
