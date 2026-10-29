import { Text, View } from '@react-pdf/renderer'
import type { ComponentProps } from 'react'

/**
 * Fixed page footer — `(  n )` (ALIGNMENT A12/B11, lane 4).
 *
 * Parenthetical page numbers with 3-digit padding: `(  1 )`, `(  2 )`, …
 * Total page count is passed by the caller (react-pdf render gives
 * `pageNumber` but no page count). Omit `pageNumber` and it takes the
 * renderer's own number.
 */
type PdfStyle = ComponentProps<typeof View>['style']

type FooterStyles = {
  footer: PdfStyle
  footerText: PdfStyle
}

export const PageFooter = ({
  wellId,
  pageNumber,
  totalPages = 1,
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
      const numStr = String(current).padStart(3, ' ')
      return (
        <Text style={styles.footerText}>
          {`( ${numStr} )`}
        </Text>
      )
    }}
  />
)
