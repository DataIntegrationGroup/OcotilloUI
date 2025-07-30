import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  useTheme,
} from '@mui/material'
import { Controller, Control, Path } from 'react-hook-form'

export interface RadioOption {
  value: string
  label: string
  description?: string
}

export const ControlledRadioFormSelection = <T,>({
  control,
  name,
  label,
  options,
  onValueChange,
  ...radioProps
}: {
  control: Control<T>
  name: Path<T>
  label: string
  options: RadioOption[]
  onValueChange?: (value: string) => void
} & Omit<React.ComponentProps<typeof RadioGroup>, 'name'>) => {
  const theme = useTheme()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState?.error}>
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            value={field.value}
            onChange={(e) => {
              const value = e.target.value
              field.onChange(value)
              onValueChange?.(value)
            }}
            {...radioProps}
          >
            {options.map(({ value, label, description }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                label={
                  description ? (
                    <div>
                      <div style={{ fontWeight: 'medium' }}>{label}</div>
                      <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>
                        {description}
                      </div>
                    </div>
                  ) : (
                    label
                  )
                }
                sx={{
                  marginBottom: 1,
                  '& .MuiFormControlLabel-label': {
                    width: '100%',
                  },
                }}
              />
            ))}
          </RadioGroup>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
} 