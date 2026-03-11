import { Text, View, Image } from '@react-pdf/renderer'
import { createPdfStyles } from '@/utils'
import { BaseRecord } from '@refinedev/core'

export const ImageGallery = ({
  assets,
  styles,
}: {
  assets: BaseRecord[]
  styles: ReturnType<typeof createPdfStyles>
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Image Gallery</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {assets.map((img: any, idx: number) =>
          img.signed_url ? (
            <View key={idx}>
              <Image style={styles.img} src={img.signed_url} />
              <Text style={styles.imgLabel}>{img.label}</Text>
            </View>
          ) : null
        )}
      </View>
    </View>
  )
}
