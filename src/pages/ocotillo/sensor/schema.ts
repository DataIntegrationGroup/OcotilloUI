import * as yup from 'yup'

export const SensorResponseSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().required(),
  model: yup.string().required(),
  serial_no: yup.string().required(),
  datetime_installed: yup.string().required(),
  datetime_removed: yup.string().required(),
  recording_interval: yup.number().required(),
  notes: yup.string().required(),
})

export const SensorCreateSchema = yup.object({
  name: yup.string().required(),
  model: yup.string().required(),
  serial_no: yup.string().required(),
  datetime_installed: yup.string().required(),
  datetime_removed: yup.string().required(),
  recording_interval: yup.number().required(),
  notes: yup.string().required(),
})

export const SensorUpdateSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().nullable(),
  model: yup.string().nullable(),
  serial_no: yup.string().nullable(),
  datetime_installed: yup.string().nullable(),
  datetime_removed: yup.string().nullable(),
  recording_interval: yup.number().nullable(),
  notes: yup.string().nullable(),
})