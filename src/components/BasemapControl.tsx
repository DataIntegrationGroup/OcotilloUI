import { Layers } from '@mui/icons-material'
import { Box, IconButton, Popover, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'

import BasemapSelector from './BasemapSelector'

interface BasemapControlProps {
  value: string
  onChange: (nextValue: string) => void
  /** Rendered inside a relatively positioned map container. */
  sx?: React.ComponentProps<typeof Box>['sx']
}

/**
 * Floating map overlay that lets a user swap the active basemap
 * (satellite, streets, outdoors, ...) without leaving the page.
 */
export const BasemapControl: React.FC<BasemapControlProps> = ({
  value,
  onChange,
  sx,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = Boolean(anchorEl)

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 2,
        ...sx,
      }}
    >
      <Tooltip title="Change basemap">
        <IconButton
          data-testid="basemap-control-button"
          aria-label="Change basemap"
          aria-haspopup="true"
          aria-expanded={open}
          size="small"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{
            backgroundColor: 'background.paper',
            boxShadow: 2,
            borderRadius: 1,
            '&:hover': { backgroundColor: 'background.paper' },
          }}
        >
          <Layers fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1, width: 260 } } }}
      >
        <Typography
          variant="overline"
          sx={{ display: 'block', px: 0.5, pb: 0.5, lineHeight: 1.4 }}
        >
          Base Maps
        </Typography>
        <BasemapSelector value={value} onChange={onChange} />
      </Popover>
    </Box>
  )
}

export default BasemapControl
