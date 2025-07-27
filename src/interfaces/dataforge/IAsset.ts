export interface IAsset {
  id: number
  label: string
  name: string
  storage_path: string
  storage_service: string
  created_at: string
  mime_type: string
  size: number
  file: any
  thing_id: number | null
  url: string
}
