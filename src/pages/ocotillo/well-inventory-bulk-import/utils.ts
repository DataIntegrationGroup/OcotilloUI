import { wellInventoryRowSchema } from './schema'
import type { WellInventoryRow } from './schema'

export type { WellInventoryRow }

// Derive field names from the zod schema
export const allFieldNames: string[] = Object.keys(wellInventoryRowSchema.shape)

// Field type definitions (used for grid column configuration)
const requiredNumericFields = ['utm_easting', 'utm_northing', 'elevation_ft', 'measuring_point_height_ft']
const requiredStringFields = ['utm_zone']
const optionalNumericFields = ['total_well_depth_ft', 'historic_depth_to_water_ft', 'well_pump_depth_ft', 'casing_diameter_ft']
const otherRequiredStringFields = ['project', 'well_name_point_id', 'site_name', 'date_time', 'field_staff', 'elevation_method']

export const numericFields = [...requiredNumericFields, ...optionalNumericFields]
export const booleanFields = ['is_open', 'datalogger_possible', 'sample_possible']
export const requiredFields = [...otherRequiredStringFields, ...requiredStringFields, ...requiredNumericFields]

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

// Error mapping types
export type ErrorMap = Map<number, string[]>
export type FieldErrorMap = Map<string, Set<string>>

// API error types
export interface ApiValidationError {
  row: number
  field: string
  error: string
  value?: string
}

// Map validation errors to error maps
export function mapValidationErrors<T extends { id: number }>(
  errors: Array<{ rowIndex: number; errors: string[] }>,
  rows: T[]
): [ErrorMap, FieldErrorMap] {
  const errorMap = new Map<number, string[]>()
  const fieldErrorMap = new Map<string, Set<string>>()

  errors.forEach(({ rowIndex, errors }) => {
    const tableRow = rows[rowIndex - 1]
    if (!tableRow) return

    errorMap.set(tableRow.id, errors)

    errors.forEach(error => {
      const match = error.match(/^([^:]+):\s*(.+)$/)
      if (match) {
        const [, fieldName, errorMessage] = match
        const key = `${tableRow.id}-${fieldName.trim()}`
        if (!fieldErrorMap.has(key)) {
          fieldErrorMap.set(key, new Set())
        }
        fieldErrorMap.get(key)!.add(errorMessage.trim())
      }
    })
  })

  return [errorMap, fieldErrorMap]
}

// Map API validation errors to error maps
export function mapApiErrors<T extends { id: number }>(
  apiErrors: ApiValidationError[],
  rows: T[]
): [ErrorMap, FieldErrorMap] {
  const errorMap = new Map<number, string[]>()
  const fieldErrorMap = new Map<string, Set<string>>()

  apiErrors.forEach(apiError => {
    const tableRow = rows[apiError.row - 1]
    if (!tableRow) return

    const errorMsg = `${apiError.field}: ${apiError.error}`
    const existingErrors = errorMap.get(tableRow.id) || []
    errorMap.set(tableRow.id, [...existingErrors, errorMsg])

    const key = `${tableRow.id}-${apiError.field}`
    if (!fieldErrorMap.has(key)) {
      fieldErrorMap.set(key, new Set())
    }
    fieldErrorMap.get(key)!.add(apiError.error)
  })

  return [errorMap, fieldErrorMap]
}

