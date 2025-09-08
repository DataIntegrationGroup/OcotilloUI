import * as yup from 'yup'

export const GroundwaterLevelObservationResponseSchema = yup.object({
    id: yup.number().required(),
    observation_datetime: yup.string().required(),
    created_at: yup.string().required(),
    release_status: yup.string().required(),
    sample_id: yup.number().required(),
    sensor_id: yup.number().required(),
    observed_property: yup.string().required(),
    value: yup.number().nullable(),
    unit: yup.string().required(),
    depth_to_water_bgs: yup.number().required(),
    measuring_point_height: yup.number().nullable(),
    level_status: yup.string().required(),
  }).noUnknown(true)

export const GroundwaterLevelObservationCreateSchema = yup.object({
    sample_id: yup.number().required(),
    sensor_id: yup.number().required(),
    observed_property: yup.string().required(),
    observation_datetime: yup.string().required(),
    value: yup.number().required(),
    unit: yup.string().required(),
    depth_to_water_bgs: yup.number().required(),
    measuring_point_height: yup.number().nullable(),
    level_status: yup.string().required(),
    release_status: yup.string().required(),
}).noUnknown(true)

export const GroundwaterLevelObservationUpdateSchema = yup.object({
    id: yup.number().required(),
    observed_property: yup.string().required(),
    observation_datetime: yup.string().required(),
    sample_id: yup.number().required(),
    sensor_id: yup.number().required(),
    value: yup.number().required(),
    unit: yup.string().required(),
    depth_to_water_bgs: yup.number().required(),
    measuring_point_height: yup.number().nullable(),
    level_status: yup.string().required(),
    release_status: yup.string().required(),
}).noUnknown(true)