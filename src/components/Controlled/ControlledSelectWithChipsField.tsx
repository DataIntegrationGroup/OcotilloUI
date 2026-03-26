import React, { useEffect } from 'react'
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  SelectProps,
  Chip,
  Box,
  SelectChangeEvent,
} from '@mui/material'
import { Control, Path, useController } from 'react-hook-form'

export const ControlledSelectWithChipsField = <T,>({
  control,
  name,
  label,
  options,
  required,
  multiple,
  chipLimit = Number.POSITIVE_INFINITY,
  clearChipsSignal,
  resetClearChipsSignal,
  ...selectProps
}: {
  control: Control<T>
  name: string
  label: string
  options: { value: string | number; label: string }[]
  required?: boolean
  multiple?: boolean
  chipLimit?: number
  clearChipsSignal?: boolean
  resetClearChipsSignal?: () => void
} & SelectProps) => {
  const {
    field,
    fieldState,
  } = useController({
    name: name as Path<T>,
    control: control as unknown as Control<T>,
  })

  useEffect(() => {
    if (clearChipsSignal) {
      field.onChange([])
      resetClearChipsSignal?.()
    }
  }, [clearChipsSignal, field, resetClearChipsSignal])

  const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    const selectedValues = event.target.value as string[]
    const nextValue =
      selectedValues.length <= chipLimit
        ? selectedValues
        : selectedValues.slice(-chipLimit)
    field.onChange(nextValue)
  }

  const selectedValues = Array.isArray(field.value) ? field.value : []
  const resolvedId = selectProps.id ?? String(name)
  const resolvedLabelId = `${resolvedId}-label`

  return (
    <FormControl fullWidth error={!!fieldState.error} required={required}>
      <InputLabel id={resolvedLabelId}>{label}</InputLabel>
      <Select
        label={label}
        id={resolvedId}
        labelId={resolvedLabelId}
        multiple={multiple}
        {...field}
        {...selectProps}
        value={selectedValues}
        onChange={handleSelectChange}
        renderValue={(selected: string[]) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selected?.map((value: string) => (
              <Chip
                key={value}
                label={options.find((option) => option.value === value)?.label}
                color="primary"
              />
            ))}
          </Box>
        )}
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
  )
}
