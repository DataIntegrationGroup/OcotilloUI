import { Typography } from '@mui/material'
import { CanAccess } from '@refinedev/core'
import type { ReactNode } from 'react'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { ocotilloPageTitleTypographySx } from '@/components/OcotilloPageHeader'

/**
 * Page frame for the shadcn list pages: breadcrumb, title, optional
 * description and header buttons, wrapped in the resource access check. This
 * is the MUI `ListPage` header without the DataGrid, so pages that render a
 * DataTable keep the same chrome as the ones that still use ListPage.
 */

export interface ListPageShellProps {
  title: string
  description?: string
  /** Resource passed to `CanAccess`, e.g. `ocotillo.thing-well`. */
  accessResource: string
  headerButtons?: ReactNode
  children: ReactNode
}

export const ListPageShell: React.FC<ListPageShellProps> = ({
  title,
  description,
  accessResource,
  headerButtons,
  children,
}) => (
  <CanAccess resource={accessResource} action="list">
    {/* pt-3 aligns the title with the MUI List header the other lists use. */}
    <div className="flex flex-col gap-4 px-4 pb-4 pt-3 sm:px-6">
      <AppBreadcrumb />

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={ocotilloPageTitleTypographySx}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="body1"
              sx={{ maxWidth: '85ch', mt: 0.5, color: 'text.secondary' }}
            >
              {description}
            </Typography>
          ) : null}
        </div>

        {headerButtons ? (
          <div className="flex flex-wrap items-center gap-2">
            {headerButtons}
          </div>
        ) : null}
      </div>

      {children}
    </div>
  </CanAccess>
)
