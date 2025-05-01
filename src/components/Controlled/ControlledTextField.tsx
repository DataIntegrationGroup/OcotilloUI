import { TextField, TextFieldProps } from '@mui/material'
import { Controller, Control, Path } from 'react-hook-form'

export const ControlledTextField = <T,>({
  control,
  type = 'text',
  name,
  label,
  multiline = false,
  minRows = 4,
  ...textFieldProps
}: {
  control: Control<T>
  type?: React.HTMLInputTypeAttribute
  name: string
  label: string
  multiline?: boolean
  minRows?: number
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
          label={label}
          error={!!fieldState?.error}
          helperText={fieldState?.error?.message || ''}
          type={type}
          fullWidth
          multiline={multiline}
          minRows={multiline ? minRows : undefined}
        />
      )}
    />
  )
}
