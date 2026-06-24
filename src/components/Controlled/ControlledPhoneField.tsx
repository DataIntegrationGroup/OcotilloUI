import InputMask from 'react-input-mask'
import { TextField, TextFieldProps } from '@mui/material'
import { Controller, Control, FieldValues, Path } from 'react-hook-form'

export const ControlledPhoneField = <T extends FieldValues>({
  control,
  name,
  label,
  ..._textFieldProps
}: {
  control: Control<T>
  name: string
  label: string
} & TextFieldProps) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <InputMask
          mask="(999)-999-9999"
          value={String(field.value ?? '')}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            field.onChange(event.target.value.replace(/\D/g, ''))
          }
        >
          {(maskInputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
            <TextField
              {...(maskInputProps as unknown as Partial<TextFieldProps>)}
              label={label}
              error={!!fieldState?.error}
              helperText={fieldState?.error?.message || ''}
              fullWidth
            />
          )}
        </InputMask>
      )}
    />
  )
}
