export interface IAsset {
  id: number
  label: string
  name: string
  storage_path: string
  storage_service: string
  created_at: Date
  mime_type: string
  size: number
  file: any
  thing_id: number | null
  url: string
}
