import * as Yup from 'yup'
import { IWellInventoryForm } from '@/interfaces/dataforge/IWellInventoryForm'

export const WellInventorySchema = Yup.object().shape({
  location: Yup.object({
    name: Yup.string().required('Location name is required'),
    notes: Yup.string().nullable(),
    point: Yup.string().required('Location coordinates are required'),
    release_status: Yup.string().required('Release status is required'),
  }),
  well: Yup.object({
    name: Yup.string().required('Well name is required'),
    thing_type: Yup.string().oneOf(['well']).required(),
    well_depth: Yup.number()
      .nullable()
      .positive('Well depth must be positive')
      .typeError('Well depth must be a valid number'),
    hole_depth: Yup.number()
      .nullable()
      .positive('Hole depth must be positive')
      .typeError('Hole depth must be a valid number'),
    well_type: Yup.string().required('Well type is required'),
    notes: Yup.string().nullable(),
  }),
  contacts: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Contact name is required'),
      role: Yup.string().required('Contact role is required'),
      emails: Yup.array().of(
        Yup.object({
          email: Yup.string().email('Invalid email format'),
          email_type: Yup.string().required('Email type is required'),
        })
      ),
      phones: Yup.array().of(
        Yup.object({
          phone_number: Yup.string().required('Phone number is required'),
          phone_type: Yup.string().required('Phone type is required'),
        })
      ),
      addresses: Yup.array().of(
        Yup.object({
          address_line_1: Yup.string().required('Address line 1 is required'),
          address_line_2: Yup.string().nullable(),
          city: Yup.string().required('City is required'),
          state: Yup.string().required('State is required'),
          postal_code: Yup.string().required('Postal code is required'),
          address_type: Yup.string().required('Address type is required'),
        })
      ),
    })
  ).min(1, 'At least one contact is required'),
  assets: Yup.array().of(
    Yup.object({
      label: Yup.string().required('Asset label is required'),
      name: Yup.string().required('Asset name is required'),
    })
  ),
})

export const SchemaDefaults: Partial<IWellInventoryForm> = {
  location: {
    name: '',
    notes: '',
    point: '',
    release_status: 'public',
  },
  well: {
    name: '',
    thing_type: 'well',
    well_depth: undefined,
    hole_depth: undefined,
    well_type: '',
    notes: '',
  },
  contacts: [
    {
      name: '',
      role: 'owner',
      emails: [],
      phones: [],
      addresses: [],
    },
  ],
  assets: [],
} 