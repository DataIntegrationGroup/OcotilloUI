import type { ReactNode } from 'react'
import { Box, Skeleton, SxProps, Theme, Typography } from '@mui/material'
import { cn } from '@/lib/utils'

/** Shared CardHeader layout for Ocotillo list and show pages. */
export const ocotilloCardHeaderProps: { sx: SxProps<Theme> } = {
  sx: {
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: 'flex-start',
    gap: { xs: 1.5, md: 3 },
    '.MuiCardHeader-content': {
      alignSelf: 'flex-start',
      minWidth: 0,
    },
    '.MuiCardHeader-action': {
      alignSelf: { xs: 'flex-end', md: 'flex-start' },
      mr: 0,
      pt: { xs: 0.5, md: 1 },
      maxWidth: '100%',
    },
  },
}

export const ocotilloPageTitleRowSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  flexWrap: 'wrap',
} as const

export const ocotilloPageTitleTypographySx = {
  lineHeight: 1.1,
  fontWeight: 700,
} as const

/** Title row: h3 plus optional trailing content (chips, tags, etc.). */
export function OcotilloPageTitle({
  title,
  isLoading = false,
  loadingWidth = 120,
  children,
}: {
  title: ReactNode
  isLoading?: boolean
  loadingWidth?: number
  children?: ReactNode
}) {
  return (
    <Box sx={ocotilloPageTitleRowSx}>
      <Typography variant="h3" fontWeight={700} sx={ocotilloPageTitleTypographySx}>
        {isLoading ? (
          <Skeleton
            variant="text"
            width={loadingWidth}
            sx={{ fontSize: 'inherit' }}
          />
        ) : (
          title
        )}
      </Typography>
      {children}
    </Box>
  )
}

/** Wrapper for header action buttons (Preview PDF, Edit, Create, etc.). */
export function OcotilloHeaderButtons({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex max-w-full flex-wrap items-center justify-end gap-1.5',
        '[&_button]:shrink-0',
        className
      )}
    >
      {children}
    </div>
  )
}
