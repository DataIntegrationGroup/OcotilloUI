import { Text, View } from '@react-pdf/renderer'
import type { ComponentProps } from 'react'

/**
 * Fixed page footer — `Well ID: X | ( n/N )` (ALIGNMENT A12/B11, lane 40 fix).
 *
 * Shows well ID + parenthetical page fraction: `( 1/4 )`.
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
      return (
        <Text style={styles.footerText}>
          {`Well ID: ${wellId} | ( ${current}/${totalPages} )`}
        </Text>
      )
    }}
  />
)
