import { Text, View } from '@react-pdf/renderer'
import type { FieldCompilationStyles } from '../fieldCompilation/styles'

/**
 * NoteSection — renders a section card with an accent bar, title, and note text.
 * Extracted from `page.tsx` as part of the PDF decomposition (Job 2).
 */
const NoteSection = ({
  title,
  value,
  styles,
  accentBarHeight = 9,
}: {
  title: string
  value: string
  styles: FieldCompilationStyles
  accentBarHeight?: number
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionTitleBar}>
      <View style={[styles.accentBar, { height: accentBarHeight }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.noteText}>{value}</Text>
  </View>
)

export default NoteSection
