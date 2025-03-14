export interface IWell {
  PointID: string;

  formation: string;
  construction_notes: string;

  casing_depth_ftbgs: number;
  casing_description: string;
  casing_diameter_ft: number;

  hole_depth_ftbgs: number;
  measuring_point: string;
  measuring_point_height_ft: number;
  measuring_point_height_ftin: string;
  monitoring_status: string;
  notes: string;
  ose_well_id: string;
  ose_welltag_id: string;
  screens: string;
  static_water_level_ftbgs: number;
  well_depth_ftbgs: number;
}
