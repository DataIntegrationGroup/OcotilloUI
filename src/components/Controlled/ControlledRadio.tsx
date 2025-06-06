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
import { CheckCircle, HighlightOff } from '@mui/icons-material'

export const ControlledRadio = <T,>({
  control,
  name,
  label,
  ...radioProps
}: {
  control: Control<T>
  name: Path<T>
  label: string
} & Omit<React.ComponentProps<typeof Radio>, 'name'>) => {
  const theme = useTheme()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selectedValue = String(field.value)
        return (
          <FormControl error={!!fieldState?.error}>
            <FormLabel>{label}</FormLabel>
            <RadioGroup
              row
              value={selectedValue}
              onChange={(e) => field.onChange(e.target.value === 'true')}
            >
              {[
                { value: 'false', label: 'No', icon: <HighlightOff /> },
                { value: 'true', label: 'Yes', icon: <CheckCircle /> },
              ].map(({ value, label, icon }) => {
                const isSelected = selectedValue === value
                return (
                  <FormControlLabel
                    key={value}
                    value={value}
                    control={
                      <Radio
                        {...radioProps}
                        icon={icon}
                        checkedIcon={icon}
                        sx={{ padding: '0px 8px 0px 0px' }}
                      />
                    }
                    label={label}
                    sx={{
                      border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      borderRadius: theme.shape.borderRadius,
                      padding: '4px 8px',
                      marginRight: 2,
                      '& .MuiFormControlLabel-label': {
                        color: isSelected ? 'primary.main' : 'inherit',
                        fontWeight: isSelected ? 'bold' : 'normal',
                      },
                    }}
                  />
                )
              })}
            </RadioGroup>
            {fieldState.error && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )
      }}
    />
  )
}
