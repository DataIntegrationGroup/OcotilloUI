import { wellInventoryRowSchema } from './schema'
import type { WellInventoryRow } from './schema'

export type { WellInventoryRow }

// Derive field names from the zod schema - single source of truth
export const allFieldNames: string[] = Object.keys(wellInventoryRowSchema.shape)

// Fields that should be initialized as empty strings (for editable table cells)
export const requiredNumericFields = ['utm_easting', 'utm_northing', 'utm_zone', 'elevation_ft', 'measuring_point_height_ft']
export const optionalNumericFields = ['total_well_depth_ft', 'historic_depth_to_water_ft', 'well_pump_depth_ft', 'casing_diameter_ft']
export const booleanFields = ['is_open', 'datalogger_possible', 'sample_possible']

// All numeric fields (required + optional)
export const numericFields = [...requiredNumericFields, ...optionalNumericFields]

// Required string fields (from schema - fields that are not optional and not numeric/boolean)
const requiredStringFields = ['project', 'well_name_point_id', 'site_name', 'date_time', 'field_staff', 'elevation_method']

// All required fields
export const requiredFields = [...requiredStringFields, ...requiredNumericFields]

// Create an empty row with all fields initialized
export function createEmptyRow(): WellInventoryRow {
  const row: any = {}
  
  allFieldNames.forEach((fieldName) => {
    if (requiredNumericFields.includes(fieldName)) {
      // Required numeric fields - initialize as empty string for table editing
      row[fieldName] = ''
    } else if (optionalNumericFields.includes(fieldName)) {
      // Optional numeric fields - initialize as undefined
      row[fieldName] = undefined
    } else if (booleanFields.includes(fieldName)) {
      // Optional boolean fields - initialize as undefined
      row[fieldName] = undefined
    } else {
      // String fields - initialize as empty string
      row[fieldName] = ''
    }
  })
  
  return row as WellInventoryRow
}

// Parse a single row using the schema and return the errors
export function validateRow(row: any, rowIndex: number): { isValid: boolean; errors: string[] } {
  const result = wellInventoryRowSchema.safeParse(row)
  
  if (result.success) {
    return { isValid: true, errors: [] }
  }
  
  const errors = result.error.issues.map(err => {
    const field = err.path.join('.')
    return `${field}: ${err.message}`
  })
  
  return { isValid: false, errors }
}

// Validate all rows and return the errors
export function validateAllRows(rows: any[]): Array<{ rowIndex: number; errors: string[] }> {
  const validationErrors: Array<{ rowIndex: number; errors: string[] }> = []
  const wellNamePointIds = new Set<string>()
  
  rows.forEach((row, index) => {
    const validation = validateRow(row, index)
    const errors = [...validation.errors]
    
    if (errors.length > 0) {
      validationErrors.push({
        rowIndex: index + 1, // 1-based for display due to table header row
        errors,
      })
    }
  })
  
  return validationErrors
}

