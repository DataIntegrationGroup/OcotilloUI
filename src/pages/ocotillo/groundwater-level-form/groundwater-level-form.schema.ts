import * as Yup from 'yup'
import { IGroundwaterLevelForm } from '@/interfaces/ocotillo/IGroundwaterLevel'

const thingStepSchema = {
  thing_id: Yup.number().required('Thing ID is required'),
}

const sampleStepSchema = {
  field_sample_id: Yup.string().required('Field Sample ID is required'),
  sample_date: Yup.date()
    .required('Sample date is required')
    .typeError('Sample date must be a valid date'),
  qc_sample: Yup.string(),
  // sample_top: Yup.number(),
  // sample_bottom: Yup.number(),
  sensor_id: Yup.number().required('Sensor ID is required'),
  notes: Yup.string(),
  release_status: Yup.string().required('Release status is required'),
}

const observationStepSchema = {
  observed_property: Yup.string().required('Observed property is required'),
  observation_datetime: Yup.date()
    .required('Observation timestamp is required')
    .typeError('Observation timestamp must be a valid date'),
  depth_to_water_bgs: Yup.number()
    .required('Depth to water is required')
    .positive('Depth to water must be positive')
    .typeError('Depth to water must be a valid number'),
  measuring_point_height: Yup.number()
    .required('Measuring point height is required')
    // .positive('Measuring point height must be positive')
    .typeError('Measuring point height must be a valid number'),
  release_status: Yup.string().required('Release status is required'),
  level_status: Yup.string().required('Level status is required'),
}

export const groundwaterLevelStepSchemas: Yup.ObjectSchema<any>[] = [
  Yup.object(thingStepSchema),
  Yup.object({ sample: Yup.object(sampleStepSchema) }),
  Yup.object({ observation: Yup.object(observationStepSchema) }),
  Yup.object(),
]

export const SchemaDefaults: Partial<IGroundwaterLevelForm> = {
  thing_id: 4,
  sample: {
    field_sample_id: 'JR-2025-001',
    duplicate_sample_number: 0,
    sample_type: 'groundwater',
    sensor_id: 1,
    sample_date: new Date(),
    qc_sample: 'original',
    sample_top: undefined,
    sample_bottom: undefined,
    notes: '',
    release_status: 'draft',
  },
  observation: {
    sensor_id: 1,
    measuring_point_height: 1,
    depth_to_water_bgs: 123,
    value: 123,
    observation_datetime: new Date(),
    observed_property: 'groundwater level',
    release_status: 'draft',
    level_status: 'normal',
  },
}
