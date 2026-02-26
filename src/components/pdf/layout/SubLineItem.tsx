import { createPdfStyles, formatTitle } from '@/utils'
import { Text, View } from '@react-pdf/renderer'

export const SubLineItem = ({
  title,
  value,
  styles,
  dense = false,
}: {
  title: string
  value?: string | number
  styles: ReturnType<typeof createPdfStyles>
  dense?: boolean
}) => {
  const safe = (v: React.ReactNode, fallback = 'N/A') =>
    v === null || v === undefined || v === '' ? fallback : v

  if (dense) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          ...styles.subSection,
        }}
      >
        <Text style={styles.label}>{formatTitle(title)} </Text>
        <Text style={styles.value}>{safe(value, '')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.subSection}>
      <Text style={styles.label}>{formatTitle(title)}</Text>
      <Text style={styles.value}>{safe(value)}</Text>
    </View>
  )
}
