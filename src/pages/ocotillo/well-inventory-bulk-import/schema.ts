import { z } from 'zod'

const optionalNumber = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const num = Number(val)
    return isNaN(num) ? undefined : num
  },
  z.number().optional()
)

const optionalString = z.string().optional().or(z.literal(''))

// Required number field (rejects empty strings)
const requiredNumber = (message: string) =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return NaN
      return val
    },
    z.coerce.number().refine((val) => !isNaN(val), { message })
  )

// Optional boolean field (allows empty strings)
const optionalBoolean = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined
    if (typeof val === 'boolean') return val
    const str = String(val).toLowerCase()
    return str === 'true' || str === '1' || str === 'yes'
  },
  z.boolean().optional()
)

export const wellInventoryRowSchema = z.object({
  // Required fields
  project: z.string().min(1, 'Project is required'),
  well_name_point_id: z.string().min(1, 'Well name/point ID is required'),
  site_name: z.string().min(1, 'Site name is required'),
  date_time: z.string().min(1, 'Date/Time is required'),
  field_staff: z.string().min(1, 'Field staff is required'),
  utm_easting: requiredNumber('UTM Easting is required and must be a number'),
  utm_northing: requiredNumber('UTM Northing is required and must be a number'),
  utm_zone: z.string().min(1, 'UTM Zone is required'),
  elevation_ft: requiredNumber('Elevation (ft) is required and must be a number'),
  elevation_method: z.string().min(1, 'Elevation method is required'),
  measuring_point_height_ft: requiredNumber('Measuring point height (ft) is required and must be a number'),

  // Optional field staff
  field_staff_2: z.string().optional(),
  field_staff_3: z.string().optional(),

  // Contact 1 fields
  contact_1_name: z.string().optional(),
  contact_1_organization: z.string().optional(),
  contact_1_role: z.string().optional(),
  contact_1_type: z.string().optional(),
  contact_1_phone_1: z.string().optional(),
  contact_1_phone_1_type: z.string().optional(),
  contact_1_phone_2: z.string().optional(),
  contact_1_phone_2_type: z.string().optional(),
  contact_1_email_1: z.string().optional(),
  contact_1_email_1_type: z.string().optional(),
  contact_1_email_2: z.string().optional(),
  contact_1_email_2_type: z.string().optional(),
  contact_1_address_1_line_1: z.string().optional(),
  contact_1_address_1_line_2: z.string().optional(),
  contact_1_address_1_type: z.string().optional(),
  contact_1_address_1_state: z.string().optional(),
  contact_1_address_1_city: z.string().optional(),
  contact_1_address_1_postal_code: z.string().optional(),
  contact_1_address_2_line_1: z.string().optional(),
  contact_1_address_2_line_2: z.string().optional(),
  contact_1_address_2_type: z.string().optional(),
  contact_1_address_2_state: z.string().optional(),
  contact_1_address_2_city: z.string().optional(),
  contact_1_address_2_postal_code: z.string().optional(),

  // Contact 2 fields
  contact_2_name: z.string().optional(),
  contact_2_organization: z.string().optional(),
  contact_2_role: z.string().optional(),
  contact_2_type: z.string().optional(),
  contact_2_phone_1: z.string().optional(),
  contact_2_phone_1_type: z.string().optional(),
  contact_2_phone_2: z.string().optional(),
  contact_2_phone_2_type: z.string().optional(),
  contact_2_email_1: z.string().optional(),
  contact_2_email_1_type: z.string().optional(),
  contact_2_email_2: z.string().optional(),
  contact_2_email_2_type: z.string().optional(),
  contact_2_address_1_line_1: z.string().optional(),
  contact_2_address_1_line_2: z.string().optional(),
  contact_2_address_1_type: z.string().optional(),
  contact_2_address_1_state: z.string().optional(),
  contact_2_address_1_city: z.string().optional(),
  contact_2_address_1_postal_code: z.string().optional(),
  contact_2_address_2_line_1: z.string().optional(),
  contact_2_address_2_line_2: z.string().optional(),
  contact_2_address_2_type: z.string().optional(),
  contact_2_address_2_state: z.string().optional(),
  contact_2_address_2_city: z.string().optional(),
  contact_2_address_2_postal_code: z.string().optional(),

  // Site information
  directions_to_site: z.string().optional(),
  specific_location_of_well: z.string().optional(),
  repeat_measurement_permission: optionalBoolean,
  sampling_permission: optionalBoolean,
  datalogger_installation_permission: optionalBoolean,
  public_availability_acknowledgement: optionalBoolean,
  special_requests: z.string().optional(),
  result_communication_preference: z.string().optional(),
  contact_special_requests_notes: z.string().optional(),

  // Well details
  ose_well_record_id: z.string().optional(),
  date_drilled: z.string().optional(),
  completion_source: z.string().optional(),
  total_well_depth_ft: optionalNumber,
  historic_depth_to_water_ft: optionalNumber,
  depth_source: z.string().optional(),
  well_pump_type: z.string().optional(),
  well_pump_depth_ft: optionalNumber,
  is_open: optionalBoolean,
  datalogger_possible: optionalBoolean,
  casing_diameter_ft: optionalNumber,
  measuring_point_description: z.string().optional(),
  well_purpose: z.string().optional(),
  well_purpose_2: z.string().optional(),
  well_hole_status: z.string().optional(),
  monitoring_frequency: z.string().optional(),
  sampling_scenario_notes: z.string().optional(),
  well_measuring_notes: z.string().optional(),
  sample_possible: optionalBoolean,
}).superRefine((data, ctx) => {
  // Contact validation: if name exists, role and type must exist
  for (const contactNum of [1, 2]) {
    const name = data[`contact_${contactNum}_name` as keyof typeof data] as string | undefined
    const role = data[`contact_${contactNum}_role` as keyof typeof data] as string | undefined
    const type = data[`contact_${contactNum}_type` as keyof typeof data] as string | undefined

    if (name) {
      if (!role) {
        ctx.addIssue({
          code: 'custom',
          message: `contact_${contactNum}_role must be provided if name is provided`,
          path: [`contact_${contactNum}_role`]
        })
      }
      if (!type) {
        ctx.addIssue({
          code: 'custom',
          message: `contact_${contactNum}_type must be provided if name is provided`,
          path: [`contact_${contactNum}_type`]
        })
      }
    }

    // Phone validation: if phone exists, phone_type must exist
    for (const phoneNum of [1, 2]) {
      const phone = data[`contact_${contactNum}_phone_${phoneNum}` as keyof typeof data] as string | undefined
      const phoneType = data[`contact_${contactNum}_phone_${phoneNum}_type` as keyof typeof data] as string | undefined
      if (phone && !phoneType) {
        ctx.addIssue({
          code: 'custom',
          message: `contact_${contactNum}_phone_${phoneNum}_type must be provided if phone number is provided`,
          path: [`contact_${contactNum}_phone_${phoneNum}_type`]
        })
      }
    }

    // Email validation: if email exists, email_type must exist
    for (const emailNum of [1, 2]) {
      const email = data[`contact_${contactNum}_email_${emailNum}` as keyof typeof data] as string | undefined
      const emailType = data[`contact_${contactNum}_email_${emailNum}_type` as keyof typeof data] as string | undefined
      if (email && !emailType) {
        ctx.addIssue({
          code: 'custom',
          message: `contact_${contactNum}_email_${emailNum}_type must be provided if email is provided`,
          path: [`contact_${contactNum}_email_${emailNum}_type`]
        })
      }
    }

    // Address validation: if any address field exists, all required fields must exist
    for (const addrNum of [1, 2]) {
      const line1 = data[`contact_${contactNum}_address_${addrNum}_line_1` as keyof typeof data] as string | undefined
      const type = data[`contact_${contactNum}_address_${addrNum}_type` as keyof typeof data] as string | undefined
      const state = data[`contact_${contactNum}_address_${addrNum}_state` as keyof typeof data] as string | undefined
      const city = data[`contact_${contactNum}_address_${addrNum}_city` as keyof typeof data] as string | undefined
      const postalCode = data[`contact_${contactNum}_address_${addrNum}_postal_code` as keyof typeof data] as string | undefined
      const line2 = data[`contact_${contactNum}_address_${addrNum}_line_2` as keyof typeof data] as string | undefined

      // Check if any address field is filled
      const hasAnyAddressField = line1 || type || state || city || postalCode || line2

      if (hasAnyAddressField) {
        if (!line1) {
          ctx.addIssue({
            code: 'custom',
            message: `contact_${contactNum}_address_${addrNum}_line_1 is required when address fields are provided`,
            path: [`contact_${contactNum}_address_${addrNum}_line_1`]
          })
        }
        if (!type) {
          ctx.addIssue({
            code: 'custom',
            message: `contact_${contactNum}_address_${addrNum}_type is required when address fields are provided`,
            path: [`contact_${contactNum}_address_${addrNum}_type`]
          })
        }
        if (!state) {
          ctx.addIssue({
            code: 'custom',
            message: `contact_${contactNum}_address_${addrNum}_state is required when address fields are provided`,
            path: [`contact_${contactNum}_address_${addrNum}_state`]
          })
        }
        if (!city) {
          ctx.addIssue({
            code: 'custom',
            message: `contact_${contactNum}_address_${addrNum}_city is required when address fields are provided`,
            path: [`contact_${contactNum}_address_${addrNum}_city`]
          })
        }
        if (!postalCode) {
          ctx.addIssue({
            code: 'custom',
            message: `contact_${contactNum}_address_${addrNum}_postal_code is required when address fields are provided`,
            path: [`contact_${contactNum}_address_${addrNum}_postal_code`]
          })
        }
      }
    }
  }
})

export type WellInventoryRow = z.infer<typeof wellInventoryRowSchema>

export const wellInventoryRowsSchema = z.array(wellInventoryRowSchema)
