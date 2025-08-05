import { Box, TextField, TextFieldProps } from '@mui/material'
import { Controller, Control, Path } from 'react-hook-form'

export const ControlledNumberField = <T,>({
  control,
  type = 'text',
  name,
  label,
  showAsterisk = false,
  warning = false,
  ...textFieldProps
}: {
  control: Control<T>
  type?: React.HTMLInputTypeAttribute
  name: string
  label: string
  showAsterisk?: boolean
  warning?: boolean
} & TextFieldProps) => {
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
            //number convresion of text field 
            const numValue = value === '' ? null : Number(value)
            //revert to string if not a number
            field.onChange(isNaN(numValue!) ? value : numValue)
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
