import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  SelectProps,
  Box,
} from '@mui/material'
import { Controller, Control, Path } from 'react-hook-form'
import { omit } from 'lodash'

export const ControlledSelectField = <T,>({
  control,
  name,
  label,
  labelId,
  options,
  required,
  onOpen,
  showAsterisk = false,
  defaultValue,
  ...selectProps
}: {
  control: Control<T>
  name: string
  label: string
  labelId?: string
  options: { value: string | number; label: string }[]
  required?: boolean
  showAsterisk?: boolean
  defaultValue?: string | number
} & SelectProps) => (
  <Controller
    name={name as Path<T>}
    control={control as unknown as Control<T>}
    defaultValue={defaultValue as any}
    render={({ field, fieldState }) => (
      <FormControl fullWidth error={!!fieldState.error} required={required}>
        <InputLabel id={labelId ? labelId : undefined}>
          {label}
          {showAsterisk ? (
            <>
              {' '}
              <Box component="span" sx={{ color: 'error.main' }}>
                *
              </Box>
            </>
          ) : null}
        </InputLabel>
        <Select
          variant="outlined"
          label={label}
          labelId={labelId ? labelId : undefined}
          {...omit(field, ['required'])}
          {...omit(selectProps, ['required'])}
          value={field.value ?? ''}
          onOpen={onOpen}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {fieldState?.error && (
          <FormHelperText>{fieldState?.error?.message}</FormHelperText>
        )}
      </FormControl>
    )}
  />
)