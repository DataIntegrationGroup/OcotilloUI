import { createPdfStyles } from '@/utils'
import { Text } from '@react-pdf/renderer'

export const Header = ({
  styles,
}: {
  styles: ReturnType<typeof createPdfStyles>
}) => <Text style={styles.title}>Field Compilation Notes</Text>
