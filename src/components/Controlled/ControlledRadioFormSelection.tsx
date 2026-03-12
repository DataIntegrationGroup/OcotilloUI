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
import { ReactNode, ComponentProps } from 'react'

export interface RadioOption {
  value: string
  label: ReactNode
  description?: string
  icon?: ReactNode
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
} & Omit<ComponentProps<typeof RadioGroup>, 'name'>) => {
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
            {options.map(({ value, label, description, icon }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                label={
                  description || icon ? (
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          fontWeight: 'medium',
                        }}
                      >
                        {icon ? (
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              color: 'text.secondary',
                            }}
                          >
                            {icon}
                          </Box>
                        ) : null}
                        <Box component="span">{label}</Box>
                      </Box>
                      <Box sx={{
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        mt: 0.5,
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
