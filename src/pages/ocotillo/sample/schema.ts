import * as yup from 'yup'



export const SampleResponseSchema = yup.object({
  id: yup.number().required(),
  created_at: yup.string().required(),
  release_status: yup.string().required(),
  thing: yup.object({
    id: yup.number().required(),
    name: yup.string().required(),
  }).required(),
  sample_type: yup.string().required(),
  field_sample_id: yup.string().required(),
  sample_date: yup.string().required(),
  sampler_name: yup.string().required(),
  qc_sample: yup.string().required(),
  sensor_id: yup.number().nullable(),
  sample_matrix: yup.string().nullable(),
  sample_method: yup.string().nullable(),
  duplicate_sample_number: yup.number().nullable(),
  sample_top: yup.number().nullable(),
  sample_bottom: yup.number().nullable(),
}).noUnknown(true)

export const SampleCreateSchema = yup.object({
  thing_id: yup.number().required(),
  sample_type: yup.string().required(),
  field_sample_id: yup.string().required(),
  sample_date: yup.string().required(),
  sampler_name: yup.string().required(),
  qc_sample: yup.string().default('Original'),
  release_status: yup.string().required(),
  sensor_id: yup.number().nullable(),
  sample_matrix: yup.string().nullable(),
  sample_method: yup.string().nullable(),
  duplicate_sample_number: yup.number().nullable().default(0),
  sample_top: yup.number().nullable(),
  sample_bottom: yup.number().nullable(),
}).noUnknown(true)

export const SampleUpdateSchema = yup.object({
  thing_id: yup.number().nullable(),
  sample_type: yup.string().nullable(),
  field_sample_id: yup.string().nullable(),
  sample_date: yup.string().nullable(),
  sampler_name: yup.string().nullable(),
  qc_sample: yup.string().nullable(),
  release_status: yup.string().nullable(),
  sensor_id: yup.number().nullable(),
  sample_matrix: yup.string().nullable(),
  sample_method: yup.string().nullable(),
  duplicate_sample_number: yup.number().nullable(),
  sample_top: yup.number().nullable(),
  sample_bottom: yup.number().nullable(),
}).noUnknown(true)