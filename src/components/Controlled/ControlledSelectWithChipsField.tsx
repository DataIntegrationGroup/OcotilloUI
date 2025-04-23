import React, { useEffect, useState } from 'react'
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
import { Controller, Control, Path } from 'react-hook-form'

export const ControlledSelectWithChipsField = <T,>({
  control,
  name,
  label,
  options,
  required,
  multiple,
  chipLimit = 3,
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
  clearChipsSignal: boolean
  resetClearChipsSignal: () => void
} & SelectProps) => {
  const [selectedChips, setSelectedChips] = useState<string[]>([])

  useEffect(() => {
    if (clearChipsSignal) {
      setSelectedChips([])
      resetClearChipsSignal()
    }
  }, [clearChipsSignal, resetClearChipsSignal])

  const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    const selectedValues = event.target.value as string[]

    if (selectedValues.length <= chipLimit) {
      setSelectedChips(selectedValues)
    } else {
      // Enforce chip limit by replacing the oldest chip with the new selection
      const updatedChips = [...selectedValues]
      updatedChips.shift() // Remove the oldest chip
      setSelectedChips(updatedChips)
    }
  }

  return (
    <Controller
      name={name as Path<T>}
      control={control as unknown as Control<T>}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} required={required}>
          <InputLabel>{label}</InputLabel>
          <Select
            label={label}
            multiple={multiple}
            {...field}
            {...selectProps}
            value={selectedChips}
            onChange={(event: SelectChangeEvent<string[]>) => {
              const { value: selectedValues } = event.target
              if (selectedValues.length <= chipLimit) {
                field.onChange(selectedValues)
              } else {
                field.onChange(selectedValues.slice(-chipLimit))
              }
              handleSelectChange(event)
            }}
            renderValue={(selected: string[]) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selected?.map((value: string) => (
                  <Chip
                    key={value}
                    label={
                      options.find((option) => option.value === value)?.label
                    }
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
      )}
    />
  )
}
