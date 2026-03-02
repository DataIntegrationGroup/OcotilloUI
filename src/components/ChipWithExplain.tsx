import { useState, ReactElement } from 'react'
import { Box, Chip, Popover, Typography, Divider } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'

type ChipExplain = {
  title: string
  meaning: string
  source?: string
}

export function ChipWithExplain({
  label,
  icon,
  color,
  tooltip,
  explain,
  chipSx,
}: {
  label: string
  icon?: ReactElement | null
  color?: any
  tooltip: string
  explain: ChipExplain
  chipSx?: any
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const onOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget)
  const onClose = () => setAnchorEl(null)

  return (
    <>
      <Tooltip title={tooltip} arrow placement="top">
        <span>
          <Chip
            clickable
            onClick={onOpen}
            icon={icon ?? undefined}
            label={label}
            color={color}
            sx={chipSx}
            // helpful for keyboard users
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setAnchorEl(e.currentTarget)
              }
            }}
          />
        </span>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 320, maxWidth: '90vw' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {explain.title}
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            {explain.meaning}
          </Typography>

          {explain.source && <Divider sx={{ my: 1.5 }} />}

          {explain.source && (
            <Typography variant="caption" display="block">
              <strong>Source:</strong> {explain.source}
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  )
}
