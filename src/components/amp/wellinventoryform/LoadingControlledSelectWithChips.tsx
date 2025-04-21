import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  SelectProps,
  Tooltip,
} from '@mui/material'
import { Clear } from '@mui/icons-material'
import { Control } from 'react-hook-form'
import {
  ControlledSelectField,
  SkeletonFormField,
  ErrorAlertFormField,
} from '@/components'

export const LoadingControlledSelectWithChips = <T,>({
  isLoading,
  isError,
  errorMessage,
  options,
  control,
  label,
  name,
  required,
  resetFn,
  multiple = false,
  chipLimit = 3,
  ...props
}: {
  isLoading: boolean
  isError?: boolean
  errorMessage?: string
  options: { value: string; label: string }[]
  control: Control<T>
  name: string
  label: string
  required?: boolean
  resetFn: () => void
  multiple?: boolean
  chipLimit?: number
} & SelectProps) => {
  const [selectedChips, setSelectedChips] = useState<string[]>([])

  const handleSelectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedValues = event.target.value as string[]

    if (selectedValues.length <= chipLimit) {
      setSelectedChips(selectedValues)
    }
  }

  const handleDeleteChip = (chipToDelete: string) => {
    setSelectedChips((prevChips) =>
      prevChips.filter((chip) => chip !== chipToDelete)
    )
  }

  if (isLoading) return <SkeletonFormField />

  if (isError) return <ErrorAlertFormField message={errorMessage} />

  return (
    <Box alignItems="center" sx={{ display: 'flex' }}>
      <Tooltip title="Clear selection">
        <Button
          variant="outlined"
          onClick={resetFn}
          sx={{
            borderBottomRightRadius: 0,
            borderTopRightRadius: 0,
            height: 55,
            width: 30,
            minWidth: 'auto',
            paddingLeft: 2.5,
            paddingRight: 2.5,
          }}
        >
          <Clear />
        </Button>
      </Tooltip>
      <FormControl fullWidth required={required}>
        <ControlledSelectField
          sx={{
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
            height: 55,
            flexGrow: 1,
          }}
          options={options}
          control={control}
          label={label}
          name={name}
          required={required}
          multiple={multiple}
          value={selectedChips}
          onChange={handleSelectChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selected?.map((value) => (
                <Chip
                  key={value}
                  label={
                    options.find((option) => option.value === value)?.label
                  }
                  onDelete={() => handleDeleteChip(value)}
                  color="primary"
                />
              ))}
            </Box>
          )}
          {...props}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={selectedChips.includes(option.value)}
            >
              {option.label}
            </MenuItem>
          ))}
        </ControlledSelectField>
      </FormControl>
    </Box>
  )
}

export default LoadingControlledSelectWithChips
