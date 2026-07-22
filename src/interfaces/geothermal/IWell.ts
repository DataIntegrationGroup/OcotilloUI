// Shape of a geothermal well from GET /thing/geothermal-well.
// `well_data_id` (UUID) is the identifier used for detail/records routes.
export interface IWell {
  well_data_id: string;
  thing_id: number | null;
  api: string | null;
  name: string | null;
  well_number: string | null;
  well_class: string | null;
  well_type: string | null;
  status: string | null;
  operator: string | null;
  owner: string | null;
  total_depth: number | null;
  completion_date: string | null;
  has_geothermal_data: boolean | null;
  county: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}
