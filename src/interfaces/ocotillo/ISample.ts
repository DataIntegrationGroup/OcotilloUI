export interface ISample {
  id: number
  thing_id: number
  sample_type: string
  field_sample_id: string
  sample_date: string
  release_status: string
  sampler_name: string
  qc_sample: string
  sensor_id: number | null
  sample_matrix: string | null
  sample_method: string | null
  duplicate_sample_number: number | null
  sample_top: number | null
  sample_bottom: number | null
}
