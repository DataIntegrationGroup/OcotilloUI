export type ChemistryDisplaySource =
  | "major"
  | "minor"
  | "radionuclide"
  | "field";

export type ChemistryDisplayStandardStatus =
  | "above_mcl"
  | "above_smcl"
  | "below_mcl"
  | "below_smcl"
  | "within_smcl"
  | "no_limit"
  | "not_compared";

export type ChemistryDisplayTabKey =
  | "field_parameters"
  | "general_chemistry"
  | "environmental_tracers"
  | "additional_analyses";

export interface ChemistryDisplayStandard {
  status: ChemistryDisplayStandardStatus;
  label: string;
  primary_mcl?: number | null;
  secondary_smcl?: number | string | null;
  unit?: string | null;
  basis?: string | null;
}

export interface ChemistryDisplayResult {
  id: string;
  sample_info_id: number;
  source: ChemistryDisplaySource;
  parameter_key: string;
  parameter_name?: string | null;
  analyte?: string | null;
  symbol?: string | null;
  value?: number | null;
  unit?: string | null;
  uncertainty?: number | null;
  stabilized?: boolean | null;
  analysis_method?: string | null;
  analysis_date?: string | null;
  notes?: string | null;
  analyses_agency?: string | null;
  standard?: ChemistryDisplayStandard | null;
}

export interface ChemistryDisplaySample {
  id: number;
  thing_id: number;
  label: string;
  nma_sample_point_id?: string | null;
  nma_wclab_id?: string | null;
  collection_date?: string | null;
  collection_method?: string | null;
  collected_by?: string | null;
  analyses_agency?: string | null;
  sample_type?: string | null;
  water_type?: string | null;
  data_source?: string | null;
  data_quality?: boolean | null;
  sample_notes?: string | null;
}

export interface ChemistryResult
  extends Omit<ChemistryDisplayResult, "sample_info_id"> {
  thing_id: number;
  station_name?: string | null;
  sample_id?: number | null;
  sample_point_id?: string | null;
  observation_datetime: string;
  result_kind: ChemistryDisplaySource | "unknown";
}

export interface ChemistryResultsPage {
  items: ChemistryResult[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ChemistryDisplayCrosstabColumn {
  parameter_key: string;
  parameter_name?: string | null;
  symbol?: string | null;
  unit?: string | null;
}

export interface ChemistryDisplayCrosstabRow {
  sample_info_id: number;
  sample_label: string;
  collection_date?: string | null;
  values: Record<string, ChemistryDisplayResult>;
  sample_notes?: string | null;
}

export interface ChemistryDisplayCrosstab {
  columns: ChemistryDisplayCrosstabColumn[];
  rows: ChemistryDisplayCrosstabRow[];
}

export interface ChemistryDisplayStandardsSummary {
  above_mcl_count: number;
  above_smcl_count: number;
  compared_parameter_count: number;
  latest_analysis_date?: string | null;
}

export interface ChemistryDisplayTab {
  results: ChemistryDisplayResult[];
  standards_summary?: ChemistryDisplayStandardsSummary | null;
}

export interface ChemistryDisplayResponse {
  samples: ChemistryDisplaySample[];
  field_parameters: ChemistryDisplayTab;
  general_chemistry: ChemistryDisplayTab;
  environmental_tracers: ChemistryDisplayTab;
  additional_analyses: ChemistryDisplayTab;
}
