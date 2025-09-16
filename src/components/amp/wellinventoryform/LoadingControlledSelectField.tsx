import {
  ControlledSelectField,
  SkeletonFormField,
  ErrorAlertFormField,
} from '@/components'
import { Clear } from '@mui/icons-material'
import { Box, Button, SelectProps, Tooltip } from '@mui/material'
import { useState } from 'react'
import { Control } from 'react-hook-form'

export const LoadingControlledSelectField = <T,>({
  isLoading,
  isError,
  errorMessage,
  options,
  control,
  label,
  title,
  name,
  required,
  resetFn,
  multiple = false,
  showAsterisk = false,
  ...props
}: {
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  options: { value: string; label: string }[]
  control: Control<T>
  name: string
  label: string
  title?: string
  required?: boolean
  resetFn: () => void
  multiple?: boolean
  showAsterisk?: boolean
  } & SelectProps) => {
  const { disabled } = props

  if (isLoading) return <SkeletonFormField />

  if (isError) return <ErrorAlertFormField message={errorMessage} />

  const [tooltipOpen, setTooltipOpen] = useState(false)

  const handleMouseEnter = () => setTooltipOpen(true)
  const handleMouseLeave = () => setTooltipOpen(false)
  const handleSelectOpen = () => setTooltipOpen(false)

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}
    >
      <Tooltip title="Clear selection">
        <Button
          variant="outlined"
          disabled={disabled}
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
      <Tooltip
        placement="top"
        title={!disabled ? title : null}
        open={tooltipOpen}
        disableFocusListener
        disableTouchListener
      >
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            flexGrow: 1,
            maxWidth: 'calc(100% - 42.5px)',
          }}
        >
          <ControlledSelectField
            sx={{
              borderBottomLeftRadius: 0,
              borderTopLeftRadius: 0,
              height: 55,
              flexShrink: 0,
            }}
            options={options}
            control={control}
            label={label}
            name={name}
            required={required}
            multiple={multiple}
            onOpen={handleSelectOpen}
            showAsterisk={showAsterisk}
            {...props}
          />
        </div>
      </Tooltip>
    </Box>
  )
}
