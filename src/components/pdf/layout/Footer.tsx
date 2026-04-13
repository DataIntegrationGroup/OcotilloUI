import { createPdfStyles } from '@/utils'
import { Text, View } from '@react-pdf/renderer'

export const Footer = ({
  wellId,
  styles,
}: {
  wellId: string | number
  styles: ReturnType<typeof createPdfStyles>
}) => (
  <View
    fixed
    style={styles.footer}
    render={({ pageNumber }) => (
      <Text style={styles.footerText}>
        {`Well ID: ${wellId} | Page ${pageNumber}`}
      </Text>
    )}
  />
)
