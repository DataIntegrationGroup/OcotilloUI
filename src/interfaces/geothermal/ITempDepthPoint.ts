// One measurement in a well's temperature-depth log (the core geothermal data:
// depth vs temperature, from which thermal gradient and heat flow are derived).
// PROVISIONAL field names — confirm against the backend once the endpoint lands.
export interface ITempDepthPoint {
  depth_m: number | null
  depth_ft: number | null
  temp_f: number | null
  temp_c: number | null
  resistance: number | null
  gradient_c_km: number | null
  comment: string | null
}
