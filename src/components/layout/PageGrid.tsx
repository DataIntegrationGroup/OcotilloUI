import React from 'react'
import Grid from '@mui/material/Grid2'
import type { Grid2Props } from '@mui/material/Grid2'

type PageGridProps = {
  children: React.ReactNode
  spacing?: number
}

/**
 * A Grid container pre-configured for the app's 12-column (4 on mobile) layout.
 * Use this to start a column layout within a page.
 *
 * @example
 * <PageGrid>
 *   <PageGridItem xs={4} md={6}>Left panel</PageGridItem>
 *   <PageGridItem xs={4} md={6}>Right panel</PageGridItem>
 * </PageGrid>
 */
export const PageGrid: React.FC<PageGridProps> = ({ children, spacing = 2 }) => (
  <Grid container spacing={spacing}>
    {children}
  </Grid>
)

type PageGridItemProps = {
  children: React.ReactNode
  /** Columns to span on mobile (out of 4). Defaults to 4 (full width). */
  xs?: number
  /** Columns to span on medium screens and up (out of 12). */
  md?: number
  /** Columns to span on large screens and up (out of 12). */
  lg?: number
} & Omit<Grid2Props, 'size'>

/**
 * A Grid item for use inside PageGrid or the layout's root Grid container.
 * Defaults to full width (xs=4, inherits md from parent).
 *
 * @example
 * <PageGridItem xs={4} md={6}>Half-width on desktop</PageGridItem>
 * <PageGridItem xs={4} md={4}>One-third-width on desktop</PageGridItem>
 */
export const PageGridItem: React.FC<PageGridItemProps> = ({
  children,
  xs = 4,
  md,
  lg,
  ...rest
}) => (
  <Grid size={{ xs, md, lg }} {...rest}>
    {children}
  </Grid>
)
