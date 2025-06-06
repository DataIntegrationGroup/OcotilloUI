import {
  FormControlLabel,
  FormHelperText,
  FormControl,
  RadioGroup,
  Radio,
} from '@mui/material'
import { Controller, Control, Path } from 'react-hook-form'

export const ControlledRadio = <T,>({
  control,
  name,
  label,
  ...radioProps
}: {
  control: Control<T>
  name: string
  label: string
} & React.ComponentProps<typeof Radio>) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control as unknown as Control<T>}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState?.error}>
          <RadioGroup>
            <FormControlLabel value="false" control={<Radio />} label="no" />
            <FormControlLabel value="true" control={<Radio />} label="yes" />
          </RadioGroup>
          {fieldState.error && (
            <FormHelperText>{fieldState?.error?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
