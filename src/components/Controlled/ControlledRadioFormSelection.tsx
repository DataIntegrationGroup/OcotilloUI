import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Box,
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
  showAsterisk = false,
  ...radioProps
}: {
  control: Control<T>
  name: Path<T>
  label: string
  options: RadioOption[]
  onValueChange?: (value: string) => void
  showAsterisk?: boolean
} & Omit<React.ComponentProps<typeof RadioGroup>, 'name'>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState?.error}>
          <FormLabel>
            {label}
            {showAsterisk ? (
              <>
                {' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  *
                </Box>
              </>
            ) : null}
          </FormLabel>
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
                    <Box>
                      <Box sx={{ fontWeight: 'medium' }}>
                        {label}
                      </Box>
                      <Box sx={{ 
                        fontSize: '0.875rem', 
                        color: 'text.secondary',
                        mt: 0.5 
                      }}>
                        {description}
                      </Box>
                    </Box>
                  ) : (
                    label
                  )
                }
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