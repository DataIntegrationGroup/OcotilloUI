import { Breadcrumb } from '@refinedev/mui'
import { useLink } from '@refinedev/core'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import MuiLink, { LinkProps } from '@mui/material/Link'
import Typography from '@mui/material/Typography'

/**
 * App breadcrumb with consistent spacing. Refine's Breadcrumb uses inline
 * sx (padding: 2) that overrides theme overrides, so we pass breadcrumbProps
 * here to control spacing in one place.
 */
const breadcrumbSx = {
  paddingTop: 2,
  paddingBottom: 0,
  paddingX: 2,
}

export const AppBreadcrumb = ({
  items,
}: {
  items?: { label: string; href?: string }[]
}) => {
  const Link = useLink()

  const LinkRouter = ({
    to,
    children,
    ...restProps
  }: LinkProps & {
    to?: string
  }) => (
    <Link to={to || ''}>
      <span {...restProps}>{children}</span>
    </Link>
  )

  if (items?.length) {
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={breadcrumbSx}>
        {items.map(({ label, href }) =>
          href ? (
            <MuiLink
              key={label}
              underline="hover"
              color="inherit"
              component={LinkRouter}
              to={href}
              variant="subtitle1"
            >
              {label}
            </MuiLink>
          ) : (
            <Typography key={label} fontSize="14px">
              {label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    )
  }

  return (
    <Breadcrumb
      hideIcons
      breadcrumbProps={{
        sx: breadcrumbSx,
      }}
    />
  )
}
