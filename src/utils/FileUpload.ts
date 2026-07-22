import { IAsset } from '@/interfaces/ocotillo'

export const isImage = (asset: IAsset) => asset.mime_type?.startsWith('image/')

export const isPdf = (asset: IAsset) => asset.mime_type === 'application/pdf'

export const isText = (asset: IAsset) => asset.mime_type === 'text/plain'

export const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
