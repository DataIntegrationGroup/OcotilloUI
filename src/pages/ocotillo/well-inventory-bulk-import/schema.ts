import { z } from 'zod'

const optionalNumber = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? undefined : num
  },
  z.number().positive().optional()
)

const optionalString = z.string().optional().or(z.literal(''))

const iso8601Date = z
  .string()
  .min(1, 'Date/Time is required')
  .refine(
    (val) => {
      if (!val || val === '') return false
      // ISO 8601 with timezone offset: 2025-02-15T10:30:00-08:00
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
      return iso8601Regex.test(val) || !isNaN(Date.parse(val))
    },
    { message: 'Date must be a valid ISO 8601 timestamp with timezone offset (e.g., 2025-02-15T10:30:00-08:00)' }
  )

export const wellInventoryRowSchema = z.object({
  // Required fields
  project: z.string().min(1, 'Project is required'),
  well_name_point_id: z.string().min(1, 'Well name/point ID is required'),
  site_name: z.string().min(1, 'Site name is required'),
  date_time: iso8601Date,
  field_staff: z.string().min(1, 'Field staff is required'),
  utm_easting: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return NaN
      return Number(val)
    },
    z.number('UTM Easting is required and must be a valid number').refine(
      (val) => !isNaN(val),
      { message: 'UTM Easting is required' }
    )
  ),
  utm_northing: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return NaN
      return Number(val)
    },
    z.number('UTM Northing is required and must be a valid number').refine(
      (val) => !isNaN(val),
      { message: 'UTM Northing is required' }
    )
  ),
  utm_zone: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return NaN
      return Number(val)
    },
    z.number().int().min(1).max(60, 'UTM Zone must be between 1 and 60').refine(
      (val) => !isNaN(val),
      { message: 'UTM Zone is required' }
    )
  ),
  elevation_ft: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return NaN
      return Number(val)
    },
    z.number('Elevation (ft) is required and must be a valid number').refine(
      (val) => !isNaN(val),
      { message: 'Elevation (ft) is required' }
    )
  ),
  elevation_method: z.string().min(1, 'Elevation method is required'),
  measuring_point_height_ft: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return NaN
      return Number(val)
    },
    z.number('Measuring point height (ft) is required and must be a valid number').refine(
      (val) => !isNaN(val),
      { message: 'Measuring point height (ft) is required' }
    )
  ),

  // Optional field staff
  field_staff_2: optionalString,
  field_staff_3: optionalString,

  // Contact 1 fields
  contact_1_name: optionalString,
  contact_1_organization: optionalString,
  contact_1_role: optionalString,
  contact_1_type: optionalString,
  contact_1_phone_1: optionalString,
  contact_1_phone_1_type: optionalString,
  contact_1_phone_2: optionalString,
  contact_1_phone_2_type: optionalString,
  contact_1_email_1: optionalString,
  contact_1_email_1_type: optionalString,
  contact_1_email_2: optionalString,
  contact_1_email_2_type: optionalString,
  contact_1_address_1_line_1: optionalString,
  contact_1_address_1_line_2: optionalString,
  contact_1_address_1_type: optionalString,
  contact_1_address_1_state: optionalString,
  contact_1_address_1_city: optionalString,
  contact_1_address_1_postal_code: optionalString,
  contact_1_address_2_line_1: optionalString,
  contact_1_address_2_line_2: optionalString,
  contact_1_address_2_type: optionalString,
  contact_1_address_2_state: optionalString,
  contact_1_address_2_city: optionalString,
  contact_1_address_2_postal_code: optionalString,

  // Contact 2 fields
  contact_2_name: optionalString,
  contact_2_organization: optionalString,
  contact_2_role: optionalString,
  contact_2_type: optionalString,
  contact_2_phone_1: optionalString,
  contact_2_phone_1_type: optionalString,
  contact_2_phone_2: optionalString,
  contact_2_phone_2_type: optionalString,
  contact_2_email_1: optionalString,
  contact_2_email_1_type: optionalString,
  contact_2_email_2: optionalString,
  contact_2_email_2_type: optionalString,
  contact_2_address_1_line_1: optionalString,
  contact_2_address_1_line_2: optionalString,
  contact_2_address_1_type: optionalString,
  contact_2_address_1_state: optionalString,
  contact_2_address_1_city: optionalString,
  contact_2_address_1_postal_code: optionalString,
  contact_2_address_2_line_1: optionalString,
  contact_2_address_2_line_2: optionalString,
  contact_2_address_2_type: optionalString,
  contact_2_address_2_state: optionalString,
  contact_2_address_2_city: optionalString,
  contact_2_address_2_postal_code: optionalString,

  // Site information
  directions_to_site: optionalString,
  specific_location_of_well: optionalString,
  repeat_measurement_permission: optionalString,
  sampling_permission: optionalString,
  datalogger_installation_permission: optionalString,
  public_availability_acknowledgement: optionalString,
  result_communication_preference: optionalString,
  contact_special_requests_notes: optionalString,

  // Well details
  ose_well_record_id: optionalString,
  date_drilled: optionalString,
  completion_source: optionalString,
  total_well_depth_ft: optionalNumber,
  historic_depth_to_water_ft: optionalNumber,
  depth_source: optionalString,
  well_pump_type: optionalString,
  well_pump_depth_ft: optionalNumber,
  is_open: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined
      if (typeof val === 'boolean') return val
      const str = String(val).toLowerCase()
      return str === 'true' || str === '1' || str === 'yes'
    },
    z.boolean().optional()
  ),
  datalogger_possible: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined
      if (typeof val === 'boolean') return val
      const str = String(val).toLowerCase()
      return str === 'true' || str === '1' || str === 'yes'
    },
    z.boolean().optional()
  ),
  casing_diameter_ft: optionalNumber,
  measuring_point_description: optionalString,
  well_purpose: optionalString,
  well_purpose_2: optionalString,
  well_hole_status: optionalString,
  monitoring_frequency: optionalString,
  sampling_scenario_notes: optionalString,
  well_measuring_notes: optionalString,
  sample_possible: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined
      if (typeof val === 'boolean') return val
      const str = String(val).toLowerCase()
      return str === 'true' || str === '1' || str === 'yes'
    },
    z.boolean().optional()
  ),
})

export type WellInventoryRow = z.infer<typeof wellInventoryRowSchema>

export const wellInventoryRowsSchema = z.array(wellInventoryRowSchema)

