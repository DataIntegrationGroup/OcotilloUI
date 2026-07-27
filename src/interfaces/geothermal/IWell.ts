// Shape of a geothermal well. The first block matches the live
// GET /thing/geothermal-well response; the rest (G2 location, G3 header, G4
// api) are PROVISIONAL field names modeled from the legacy NM_Wells Geothermal
// DB — confirm against the backend contract once it lands.
export interface IWell {
  well_data_id: string
  thing_id: number | null

  // ── Identity (G4: api is state-county-well; api_suffix is separate) ──
  api: string | null
  api_suffix: string | null
  name: string | null
  well_number: string | null
  import_id: string | null
  import_db: string | null
  guid: string | null

  // ── Classification ──
  well_class: string | null
  well_type: string | null
  well_orient: string | null
  status: string | null

  // ── Operator ──
  operator: string | null
  owner: string | null
  prd_pool_count: number | null

  // ── Depth (G3) ──
  total_depth: number | null
  well_tvd: number | null
  plug_back: number | null
  fm_td: string | null
  age_td: string | null

  // ── Dates (G3) ──
  spud_date: string | null
  completion_date: string | null
  plug_date: string | null

  // ── Location (G2) ──
  latitude: number | null
  longitude: number | null
  source_datum: string | null
  basin: string | null
  county: string | null
  state: string | null

  // ── PLSS (G2) ──
  township: number | null
  township_dir: string | null
  range: number | null
  range_dir: string | null
  section: number | null
  unit_letter: string | null
  section_part: string | null
  footage_ns: number | null
  footage_ns_dir: string | null
  footage_ew: number | null
  footage_ew_dir: string | null
  utm_zone: string | null

  // ── Location accuracy (G2) ──
  loc_acc_type: string | null
  loc_acc_meas: string | null
  loc_acc_val: string | null

  // ── Data-existence flags (G3) ──
  scout_ticket: boolean | null
  downhole_survey: boolean | null
  geo_log: boolean | null
  geophys_log: boolean | null
  has_geothermal_data: boolean | null
  petro_data: boolean | null
  core_exists: boolean | null
  cuttings: boolean | null
  sample_data: boolean | null
}
