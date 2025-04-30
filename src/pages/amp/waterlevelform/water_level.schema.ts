import * as Yup from 'yup'

export const WaterLevelSchema = Yup.object().shape({
  pointid: Yup.string().required('Point ID is required'),
  type: Yup.string().required('Type is required'),
  hold: Yup.number().nullable(),
  cut: Yup.number().nullable(),
  depth_of_water: Yup.number().required('Depth to Water (DTW) is required'),
  measurement_date: Yup.string().required('Measurement Date is required'),
  LevelStatus: Yup.string().required('Level Status is required'),
  DataQuality: Yup.string().required('Data Quality is required'),
  MeasuredBy: Yup.string().required('Measured By is required'),
  Notes: Yup.string().required('Site Notes is required'),
  MPHeight: Yup.number().optional(),
  MeasurementMethod: Yup.date().required('Measurement Method is required'),
})

export const SchemaDefaults = {
  pointid: '',
  type: 'T',
  hold: undefined,
  cut: undefined,
  depth_of_water: undefined,
  measurement_date: '',
  LevelStatus: '',
  DataQuality: '',
  MeasuredBy: '',
  Notes: '',
  mp_height: undefined,
  MeasurementMethod: '',
}
