import { Text, View, Image } from '@react-pdf/renderer'
import { createPdfStyles } from '@/utils'
import { BaseRecord } from '@refinedev/core'

/**
 * Lane 33: cap image gallery to 3 photos (same as the photo column).
 */
const MAX_PHOTOS = 3

export const ImageGallery = ({
  assets,
  styles,
}: {
  assets: BaseRecord[]
  styles: ReturnType<typeof createPdfStyles>
}) => {
  // Sort newest-first, cap at MAX_PHOTOS
  const sorted = [...assets]
    .filter((a: any) => a.signed_url)
    .sort((a: any, b: any) => {
      if (a.created_at && b.created_at) {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        )
      }
      return (b.id as number ?? 0) - (a.id as number ?? 0)
    })
    .slice(0, MAX_PHOTOS)

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Image Gallery</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {sorted.map((img: any, idx: number) =>
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
