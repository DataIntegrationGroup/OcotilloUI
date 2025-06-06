import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
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
              <FormControlLabel
                value="false"
                control={
                  <Radio
                    {...radioProps}
                    icon={<HighlightOff />}
                    checkedIcon={<HighlightOff />}
                  />
                }
                label="No"
                sx={{
                  color:
                    selectedValue === 'false' ? 'primary.main' : 'text.primary',
                  '& .MuiFormControlLabel-label': {
                    color:
                      selectedValue === 'false' ? 'primary.main' : 'inherit',
                    fontWeight: selectedValue === 'false' ? 700 : 400,
                  },
                  fontWeight: selectedValue === 'false' ? 700 : 400,
                }}
              />
              <FormControlLabel
                value="true"
                control={
                  <Radio
                    {...radioProps}
                    icon={<CheckCircle />}
                    checkedIcon={<CheckCircle />}
                  />
                }
                label="Yes"
                sx={{
                  color:
                    selectedValue === 'true' ? 'primary.main' : 'text.primary',
                  '& .MuiFormControlLabel-label': {
                    color:
                      selectedValue === 'true' ? 'primary.main' : 'inherit',
                    fontWeight: selectedValue === 'true' ? 700 : 400,
                  },
                  fontWeight: selectedValue === 'true' ? 700 : 400,
                }}
              />
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
