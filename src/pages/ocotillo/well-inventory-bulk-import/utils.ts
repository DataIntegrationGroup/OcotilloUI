import { wellInventoryRowSchema } from './schema'
import type { WellInventoryRow } from './schema'

export type { WellInventoryRow }

// All possible field names (required + optional)
const allFieldNames = [
  // Required
  'project',
  'well_name_point_id',
  'site_name',
  'date_time',
  'field_staff',
  'utm_easting',
  'utm_northing',
  'utm_zone',
  'elevation_ft',
  'elevation_method',
  'measuring_point_height_ft',
  // Optional
  'field_staff_2',
  'field_staff_3',
  'contact_1_name',
  'contact_1_organization',
  'contact_1_role',
  'contact_1_type',
  'contact_1_phone_1',
  'contact_1_phone_1_type',
  'contact_1_phone_2',
  'contact_1_phone_2_type',
  'contact_1_email_1',
  'contact_1_email_1_type',
  'contact_1_email_2',
  'contact_1_email_2_type',
  'contact_1_address_1_line_1',
  'contact_1_address_1_line_2',
  'contact_1_address_1_type',
  'contact_1_address_1_state',
  'contact_1_address_1_city',
  'contact_1_address_1_postal_code',
  'contact_1_address_2_line_1',
  'contact_1_address_2_line_2',
  'contact_1_address_2_type',
  'contact_1_address_2_state',
  'contact_1_address_2_city',
  'contact_1_address_2_postal_code',
  'contact_2_name',
  'contact_2_organization',
  'contact_2_role',
  'contact_2_type',
  'contact_2_phone_1',
  'contact_2_phone_1_type',
  'contact_2_phone_2',
  'contact_2_phone_2_type',
  'contact_2_email_1',
  'contact_2_email_1_type',
  'contact_2_email_2',
  'contact_2_email_2_type',
  'contact_2_address_1_line_1',
  'contact_2_address_1_line_2',
  'contact_2_address_1_type',
  'contact_2_address_1_state',
  'contact_2_address_1_city',
  'contact_2_address_1_postal_code',
  'contact_2_address_2_line_1',
  'contact_2_address_2_line_2',
  'contact_2_address_2_type',
  'contact_2_address_2_state',
  'contact_2_address_2_city',
  'contact_2_address_2_postal_code',
  'directions_to_site',
  'specific_location_of_well',
  'repeat_measurement_permission',
  'sampling_permission',
  'datalogger_installation_permission',
  'public_availability_acknowledgement',
  'result_communication_preference',
  'contact_special_requests_notes',
  'ose_well_record_id',
  'date_drilled',
  'completion_source',
  'total_well_depth_ft',
  'historic_depth_to_water_ft',
  'depth_source',
  'well_pump_type',
  'well_pump_depth_ft',
  'is_open',
  'datalogger_possible',
  'casing_diameter_ft',
  'measuring_point_description',
  'well_purpose',
  'well_purpose_2',
  'well_hole_status',
  'monitoring_frequency',
  'sampling_scenario_notes',
  'well_measuring_notes',
  'sample_possible',
]

const requiredFields = [
  'project',
  'well_name_point_id',
  'site_name',
  'date_time',
  'field_staff',
  'utm_easting',
  'utm_northing',
  'utm_zone',
  'elevation_ft',
  'elevation_method',
  'measuring_point_height_ft',
]

export function parseCSV(file: File): Promise<WellInventoryRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          reject(new Error('CSV must have at least a header row and one data row'))
          return
        }
        
        // Parse header
        const headers = parseCSVLine(lines[0])
        const headerMap = new Map<string, number>()
        headers.forEach((header, index) => {
          headerMap.set(header.trim().toLowerCase(), index)
        })
        
        // Check for required headers
        const missingHeaders = requiredFields.filter(
          header => !headerMap.has(header.toLowerCase())
        )
        
        if (missingHeaders.length > 0) {
          reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`))
          return
        }
        
        // Parse data rows
        const rows: WellInventoryRow[] = []
        const wellNamePointIds = new Set<string>()
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          
          // Skip empty rows
          if (values.every(v => !v.trim())) continue
          
          const row: any = {}
          allFieldNames.forEach(header => {
            const index = headerMap.get(header.toLowerCase())
            if (index !== undefined && index < values.length) {
              const value = values[index]?.trim() || ''
              row[header] = value
            } else {
              // Set default empty value for missing optional fields
              row[header] = ''
            }
          })
          
          // Check for duplicate well_name_point_id
          if (row.well_name_point_id && wellNamePointIds.has(row.well_name_point_id)) {
            reject(new Error(`Duplicate well_name_point_id found: "${row.well_name_point_id}" at row ${i + 1}`))
            return
          }
          if (row.well_name_point_id) {
            wellNamePointIds.add(row.well_name_point_id)
          }
          
          rows.push(row)
        }
        
        resolve(rows)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'UTF-8')
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

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

export function validateAllRows(rows: any[]): Array<{ rowIndex: number; errors: string[] }> {
  const validationErrors: Array<{ rowIndex: number; errors: string[] }> = []
  const wellNamePointIds = new Set<string>()
  
  rows.forEach((row, index) => {
    const validation = validateRow(row, index)
    const errors = [...validation.errors]
    
    // Check for duplicate well_name_point_id
    if (row.well_name_point_id) {
      if (wellNamePointIds.has(row.well_name_point_id)) {
        errors.push(`well_name_point_id: Duplicate value "${row.well_name_point_id}" found`)
      } else {
        wellNamePointIds.add(row.well_name_point_id)
      }
    }
    
    if (errors.length > 0) {
      validationErrors.push({
        rowIndex: index + 1, // 1-based for display
        errors,
      })
    }
  })
  
  return validationErrors
}

