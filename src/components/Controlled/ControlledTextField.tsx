import { Box, TextField, TextFieldProps } from '@mui/material'
import { Controller, Control, Path } from 'react-hook-form'

export const ControlledTextField = <T,>({
  control,
  type = 'text',
  name,
  label,
  multiline = false,
  minRows = 4,
  showAsterisk = false,
  warning = false,
  ...textFieldProps
}: {
  control: Control<T>
  type?: React.HTMLInputTypeAttribute
  name: string
  label: string
  multiline?: boolean
  minRows?: number
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
          type={type}
          fullWidth
          multiline={multiline}
          minRows={multiline ? minRows : undefined}
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
