import {
  FormControlLabel,
  Checkbox,
  FormHelperText,
  FormControl,
} from '@mui/material'
import { Controller, Control, FieldValues, Path } from 'react-hook-form'

export const ControlledCheckbox = <T extends FieldValues>({
  control,
  name,
  label,
  labelPlacement = 'start',
  ...checkboxProps
}: {
  control: Control<T>
  name: string
  label: string
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom'
} & React.ComponentProps<typeof Checkbox>) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState?.error}>
          <FormControlLabel
            labelPlacement={labelPlacement}
            control={
              <Checkbox
                {...field}
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                {...checkboxProps}
              />
            }
            label={label}
          />
          {fieldState.error && (
            <FormHelperText>{fieldState?.error?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}
