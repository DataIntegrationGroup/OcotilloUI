import * as yup from 'yup'

export const ContactSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().nullable(), //TODO: make non-nullable in the API response
  role: yup.string().optional(),
  thing_id: yup.number().optional(),
  contact_type: yup.string().optional(),
  organization: yup.string().nullable().optional(),
  things: yup.array().of(yup.object({
    id: yup.number().required(),
    name: yup.string().required(),
  })).optional(),
  release_status: yup.string().required(),
  created_at: yup.string().required(),
  emails: yup.array().of(yup.object({
    email: yup.string().required(),
    email_type: yup.string().required(),
    release_status: yup.string().required(),
  })).optional(),
  phones: yup.array().of(yup.object({
    phone_number: yup.string().required(),
    phone_type: yup.string().required(),
    country_code: yup.string().optional(),
    release_status: yup.string().required(),
  })).optional(),
  addresses: yup.array().of(yup.object({
    address_line_1: yup.string().required(),
    address_line_2: yup.string().nullable(),
    city: yup.string().required(),
    state: yup.string().required(),
    postal_code: yup.string().required(),
    address_type: yup.string().required(),
    release_status: yup.string().required(),
  })).optional(),
}).noUnknown(true)