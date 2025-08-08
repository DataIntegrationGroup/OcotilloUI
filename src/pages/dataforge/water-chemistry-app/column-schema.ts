export const ID_COL = 8
export const SAMPLE_DATE_COL = 20
export const PARAMETER_COL = 3
export const RESULT_UNITS_COL = 4
export const RESULT_COL = 16
export const SAMPLE_ID_COL = 8

// 0: "CustomerName"
// 1: "CustomerContact"
// 2: "PhoneNumber"
// 3: "Param"
// 4: "Results_Units"
// 5: "Dilution"
// 6: "AnalysisTime"
// 7: "SampleNumber"
// 8: "CustomerSampleNumber"
// 9: "SamplePointID"
// 10: "OrderID"
// 11: "ProjectID"
// 12: "Matrix"
// 13: "Method"
// 14: "Test"
// 15: "UpperLimit"
// 16: "ReportedND"
// 17: "ReceiveDate"
// 18: "LowerLimit"
// 19: "LowerXdilution"
// 20: "SampleDate"
export interface IObservationUploadSchema {
  idx: number
  sampleId: string
  observedProperty: string
  resultUnits: string
  result: string
  sampleDate: string
}

export interface ISampleUploadSchema {
  idx: number
  sampleId: string
  sampleDate: string
}
