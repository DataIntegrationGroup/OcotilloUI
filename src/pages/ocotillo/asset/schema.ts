import * as yup from 'yup'

export const AssetSchema = yup.object({
  id: yup.number().required(),
  label: yup.string().nullable(), //TODO: make required in the API response
  name: yup.string().required(),
  storage_path: yup.string().required(),
  mime_type: yup.string().required(),
  size: yup.number().required(),
  uri: yup.string().required(),
  file: yup.mixed().nullable(),
  thing_id: yup.number().nullable().optional(),
  release_status: yup.string().required(),
  created_at: yup.string().required(),
  storage_service: yup.string().required(),
  signed_url: yup.string().nullable(),
}).noUnknown(true)