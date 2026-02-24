import { createPdfStyles, formatTitle } from '@/utils'
import { Text, View } from '@react-pdf/renderer'

export const LineItem = ({
  title,
  value,
  styles,
}: {
  title: string
  value?: string | number
  styles: ReturnType<typeof createPdfStyles>
}) => {
  const safe = (v: React.ReactNode, fallback = 'N/A') =>
    v === null || v === undefined || v === '' ? fallback : v

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{formatTitle(title)}</Text>
      <Text style={styles.value}>{safe(value)}</Text>
    </View>
  )
}
