import { Box, Button, FormControl, SelectProps, Tooltip } from '@mui/material'
import { Clear } from '@mui/icons-material'
import { Control } from 'react-hook-form'
import {
  ControlledSelectWithChipsField,
  SkeletonFormField,
  ErrorAlertFormField,
} from '@/components'
import { useState } from 'react'

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
  const [clearChipsSignal, setClearChipsSignal] = useState<boolean>(false)

  const handleReset = () => {
    setClearChipsSignal(true)
    resetFn()
  }

  const resetClearChipsSignal = () => {
    setClearChipsSignal(false)
  }

  if (isLoading) return <SkeletonFormField />

  if (isError) return <ErrorAlertFormField message={errorMessage} />

  return (
    <Box alignItems="center" sx={{ display: 'flex' }}>
      <Tooltip title="Clear selection">
        <Button
          variant="outlined"
          onClick={handleReset}
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
        <ControlledSelectWithChipsField
          sx={{
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
            height: 55,
            flexGrow: 1,
          }}
          options={options}
          control={control}
          clearChipsSignal={clearChipsSignal}
          resetClearChipsSignal={resetClearChipsSignal}
          label={label}
          name={name}
          required={required}
          multiple={multiple}
          chipLimit={chipLimit}
          {...props}
        />
      </FormControl>
    </Box>
  )
}

export default LoadingControlledSelectWithChips
