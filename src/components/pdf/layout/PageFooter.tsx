import { Text, View } from '@react-pdf/renderer'
import type { ComponentProps } from 'react'

/**
 * Fixed page footer — `Well ID: <point id> | Page n of N` (ALIGNMENT A12/B11).
 *
 * The legacy single-well footer (`layout/Footer.tsx`) prints `Page n` only and
 * is fed the well *name*; this one is fed the point id that page 1 prints as
 * `Point ID`.
 *
 * This react-pdf build's `render` gives `pageNumber` but no page count, so the
 * count is passed in by the caller. Omit `totalPages` and the footer prints
 * `Page n`; omit `pageNumber` and it takes the renderer's own number (right for
 * page 1, wrong for a page that prints second in someone else's document).
 *
 * Styles are passed in because the field sheet and the owner page each own a
 * style sheet; both provide `footer` (absolute) and `footerText`.
 */
type PdfStyle = ComponentProps<typeof View>['style']

type FooterStyles = {
  footer: PdfStyle
  footerText: PdfStyle
}

export const PageFooter = ({
  wellId,
  pageNumber,
  totalPages,
  styles,
}: {
  wellId: string | number
  pageNumber?: number
  totalPages?: number
  styles: FooterStyles
}) => (
  <View
    fixed
    style={styles.footer}
    render={({ pageNumber: renderedPage }) => {
      const current = pageNumber ?? renderedPage
      return (
        <Text style={styles.footerText}>
          {`Well ID: ${wellId} | Page ${current}${
            totalPages ? ` of ${totalPages}` : ''
          }`}
        </Text>
      )
    }}
  />
)
