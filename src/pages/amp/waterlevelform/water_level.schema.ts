import * as Yup from 'yup'

export const WaterLevelSchema = Yup.object().shape({
  pointid: Yup.string().required('Point ID is required'),
  hold: Yup.number()
    .nullable()
    .typeError('Hold measurement must be a valid number.'),
  cut: Yup.number()
    .nullable()
    .typeError('Cut measurement must be a valid number.'),
  depth_to_water: Yup.number()
    .nullable()
    .typeError('Depth to water must be a valid number.'),
  measurement_date: Yup.string().required('Measurement Date is required'),
  level_status: Yup.string().nullable(),
  data_source: Yup.string().nullable(),
  data_quality: Yup.string().nullable(),
  mp_height: Yup.number()
    .nullable()
    .typeError('MP Height must be a valid number.'),
  measurement_method: Yup.string().required('Measurement Method is required'),
  measured_by: Yup.string().required('Measured By is required'),
  measuring_agency: Yup.string().nullable(),
  notes: Yup.string().nullable(),
  public_release: Yup.boolean().nullable(),
})

export const SchemaDefaults = {
  pointid: '',
  hold: undefined,
  cut: undefined,
  depth_to_water: undefined,
  measurement_date: '',
  level_status: '',
  data_quality: '1',
  data_source: 'S',
  mp_height: undefined,
  measurement_method: 'S',
  measured_by: '',
  measuring_agency: 'NMBGMR',
  notes: '',
  public_release: false,
}
