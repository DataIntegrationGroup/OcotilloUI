import { settings } from '@/settings'

/**
 * Table rows are not anchors, so modifier clicks would otherwise navigate in
 * place. Treat the browser conventions for "open elsewhere" as new-window
 * intent. Shared by the MUI ListPage and the shadcn DataTable.
 */
export function isNewWindowClick(event: {
  ctrlKey?: boolean
  metaKey?: boolean
  button?: number
}): boolean {
  // Shift is left alone: grids use it for row range selection.
  return Boolean(event.ctrlKey || event.metaKey || event.button === 1)
}

export function openInNewWindow(href: string) {
  // Router paths are basename-relative; window.open is not.
  const target = href.startsWith('/') ? `${settings.urlprefix}${href}` : href
  const opened = window.open(target, '_blank', 'noopener,noreferrer')
  if (opened) opened.opener = null
}
