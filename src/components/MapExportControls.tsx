import React from 'react'
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipProps,
} from '@mui/material'
import { Download } from '@mui/icons-material'

type ExportFormat = 'csv' | 'geojson'

interface MapExportControlsProps {
  value: ExportFormat
  onChange: (value: ExportFormat) => void
  onExport: () => void
  buttonLabel: string
  tooltip: string
  disabled?: boolean
  selectorWidth?: number
  tooltipPlacement?: TooltipProps['placement']
}

const toggleButtonSx = {
  fontSize: '0.64rem',
  py: 0.1,
  px: 0.7,
  textTransform: 'none',
  flex: 1,
}

const exportButtonSx = {
  justifyContent: 'flex-start',
  minHeight: 24,
  whiteSpace: 'nowrap',
  px: 0.75,
  py: 0.15,
  fontSize: '0.68rem',
  lineHeight: 1.1,
  '& .MuiButton-startIcon': {
    mr: 0.45,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 14,
  },
}

const MapExportControls: React.FC<MapExportControlsProps> = ({
  value,
  onChange,
  onExport,
  buttonLabel,
  tooltip,
  disabled = false,
  selectorWidth,
  tooltipPlacement = 'top',
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'stretch' }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, nextValue: ExportFormat | null) => {
          if (nextValue) onChange(nextValue)
        }}
        sx={{
          height: 24,
          minWidth: 0,
          flex: selectorWidth ? '0 0 auto' : 1.35,
          width: selectorWidth,
        }}
      >
        <ToggleButton value="csv" sx={toggleButtonSx}>
          CSV
        </ToggleButton>
        <ToggleButton value="geojson" sx={toggleButtonSx}>
          GeoJSON
        </ToggleButton>
      </ToggleButtonGroup>
      <Tooltip title={tooltip} placement={tooltipPlacement}>
        <span style={{ flex: '0 0 122px', display: 'flex' }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<Download fontSize="small" />}
            onClick={onExport}
            disabled={disabled}
            sx={exportButtonSx}
          >
            {buttonLabel}
          </Button>
        </span>
      </Tooltip>
    </Box>
  )
}

export default MapExportControls
