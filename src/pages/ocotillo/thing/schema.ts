import * as yup from 'yup'

export const WaterWellResponseSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().required(),
  created_at: yup.string().required(),
  release_status: yup.string().required(),
  thing_type: yup.string().required(),
  active_location: yup.object({
    id: yup.number().required(),
    name: yup.string().required(),
    point: yup.string().required(),
    created_at: yup.string().required(),
    release_status: yup.string().required(),
  }).required(),
  well_depth: yup.number().nullable(),
  hole_depth: yup.number().nullable(),
  well_type: yup.string().nullable(),
  well_construction_notes: yup.string().nullable(),
  group_id: yup.number().nullable(),
}).noUnknown(true)

export const WaterWellCreateSchema = yup.object({
  name: yup.string().required(),
  release_status: yup.string().required(),
  thing_type: yup.string().required(),
  location_id: yup.number().required(),
  well_depth: yup.number().nullable(),
  hole_depth: yup.number().nullable(),
  well_type: yup.string().nullable(),
  well_construction_notes: yup.string().nullable(),
  group_id: yup.number().nullable(),
}).noUnknown(true)

export const WaterWellUpdateSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().required(),
  release_status: yup.string().required(),
  thing_type: yup.string().required(),
  location_id: yup.number().required(),
  well_depth: yup.number().nullable(),
  hole_depth: yup.number().nullable(),
  well_type: yup.string().nullable(),
  well_construction_notes: yup.string().nullable(),
  group_id: yup.number().nullable(),
}).noUnknown(true)