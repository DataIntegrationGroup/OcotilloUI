import * as yup from 'yup'

export const CategorySchema = yup.object({
  id: yup.number().required(),
  name: yup.string().required(),
  created_at: yup.string().required(),
  description: yup.string().nullable(),
}).noUnknown(true)

export const TermSchema = yup.object({
  id: yup.number().required(),
  term: yup.string().required(),
  definition: yup.string().required(),
  categories: yup.array().of(CategorySchema).required(),
  created_at: yup.string().required(),
}).noUnknown(true)
