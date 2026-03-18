import { Breadcrumb } from '@refinedev/mui'

/**
 * App breadcrumb with consistent spacing. Refine's Breadcrumb uses inline
 * sx (padding: 2) that overrides theme overrides, so we pass breadcrumbProps
 * here to control spacing in one place.
 */
export const AppBreadcrumb = () => (
  <Breadcrumb
    hideIcons
    breadcrumbProps={{
      sx: {
        paddingTop: 2,
        paddingBottom: 0,
        paddingX:2,
      },
    }}
  />
)
