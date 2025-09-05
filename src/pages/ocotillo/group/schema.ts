import * as yup from 'yup'

export const GroupSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().required(),
  release_status: yup.string().required(),
  created_at: yup.string().required(),
  parent_group_id: yup.number().nullable().optional(),
  project_area: yup.string().nullable().optional(),
  description: yup.string().nullable().optional(),
}).noUnknown(true)