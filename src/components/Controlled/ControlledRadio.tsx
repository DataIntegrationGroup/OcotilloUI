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
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState?.error}>
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            row
            name="position"
            defaultValue="top"
            value={String(field.value)}
            onChange={(e) => field.onChange(e.target.value === 'true')}
            {...field}
          >
            <FormControlLabel
              value="false"
              control={<Radio {...radioProps} icon={<HighlightOff />} />}
              label="No"
            />
            <FormControlLabel
              value="true"
              control={<Radio {...radioProps} icon={<CheckCircle />} />}
              label="Yes"
            />
          </RadioGroup>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
