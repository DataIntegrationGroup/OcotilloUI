import * as Yup from 'yup'
import { IWellInventoryForm } from '@/interfaces/ocotillo/IWellInventoryForm'

export const wellInventoryStepSchemas: Yup.ObjectSchema<any>[] = [
  Yup.object({
    locationMode: Yup.string()
      .oneOf(['existing', 'new'])
      .required('Location mode is required'),
    selectedLocationId: Yup.number().when('locationMode', {
      is: 'existing',
      then: (schema) => schema.required('Please select a location'),
      otherwise: (schema) => schema.nullable(),
    }),
    location: Yup.object().when('locationMode', {
      is: 'new',
      then: (schema) =>
        schema.shape({
          name: Yup.string().required('Location name is required'),
          notes: Yup.string().nullable(),
          point: Yup.string().required('Location coordinates are required'),
          release_status: Yup.string().required('Release status is required'),
        }),
      otherwise: (schema) => schema.strip(),
    }),
  }),
  Yup.object({
    well: Yup.object({
      name: Yup.string().required('Well name is required'),
      release_status: Yup.string().required('Release status is required'),
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
  }),
  Yup.object({
    wellScreens: Yup.array().of(
      Yup.object({
        screen_depth_top: Yup.number()
          .nullable()
          .positive('Screen depth top must be positive')
          .typeError('Screen depth top must be a valid number'),
        screen_depth_bottom: Yup.number()
          .nullable()
          .positive('Screen depth bottom must be positive')
          .typeError('Screen depth bottom must be a valid number'),
        screen_description: Yup.string().nullable(),
        release_status: Yup.string().required('Release status is required'),
      })
    ),
  }),
  Yup.object({
    contacts: Yup.array()
      .of(
        Yup.object({
          name: Yup.string().required('Contact name is required'),
          role: Yup.string().required('Contact role is required'),
          release_status: Yup.string().required('Release status is required'),
          emails: Yup.array().of(
            Yup.object({
              email: Yup.string().email('Invalid email format'),
              email_type: Yup.string().required('Email type is required'),
              release_status: Yup.string().required('Release status is required'),
            })
          ),
          phones: Yup.array().of(
            Yup.object({
              phone_number: Yup.string().required('Phone number is required'),
              phone_type: Yup.string().required('Phone type is required'),
              release_status: Yup.string().required('Release status is required'),
            })
          ),
          addresses: Yup.array().of(
            Yup.object({
              address_line_1: Yup.string().required(
                'Address line 1 is required'
              ),
              address_line_2: Yup.string().nullable(),
              city: Yup.string().required('City is required'),
              state: Yup.string().required('State is required'),
              postal_code: Yup.string().required('Postal code is required'),
              country: Yup.string().required('Country is required'),
              address_type: Yup.string().required('Address type is required'),
              release_status: Yup.string().required('Release status is required'),
            })
          ),
        })
      )
      .min(1, 'At least one contact is required'),
  }),
  Yup.object({
    assets: Yup.array().of(
      Yup.object({
        label: Yup.string().required('Asset label is required'),
        name: Yup.string().required('Asset name is required'),
        release_status: Yup.string().required('Release status is required'),
        storage_path: Yup.string().when('file', {
          is: (file: any) => file !== null && file !== undefined,
          then: (schema) => schema.required('Storage path is required'),
          otherwise: (schema) => schema.nullable(),
        }),
        mime_type: Yup.string().when('file', {
          is: (file: any) => file !== null && file !== undefined,
          then: (schema) => schema.required('MIME type is required'),
          otherwise: (schema) => schema.nullable(),
        }),
        size: Yup.number().when('file', {
          is: (file: any) => file !== null && file !== undefined,
          then: (schema) =>
            schema
              .required('File size is required')
              .min(0, 'File size must be non-negative'),
          otherwise: (schema) => schema.nullable(),
        }),
        url: Yup.string().when('file', {
          is: (file: any) => file !== null && file !== undefined,
          then: (schema) => schema.required('File URL is required'),
          otherwise: (schema) => schema.nullable(),
        }),
        file: Yup.mixed().nullable(),
        thing_id: Yup.number().nullable(),
      })
    ),
  }),
  Yup.object(),
]

export const SchemaDefaults: Partial<IWellInventoryForm> = {
  locationMode: 'new',
  selectedLocationId: undefined,
  location: {
    name: '',
    notes: '',
    point: '',
    release_status: '',
  },
  well: {
    name: '',
    release_status: 'draft',
    thing_type: 'well',
    well_depth: undefined,
    hole_depth: undefined,
    well_type: '',
    notes: '',
  },
  wellScreens: [
    {
      screen_depth_top: undefined,
      screen_depth_bottom: undefined,
      screen_description: '',
      release_status: 'draft',
    },
  ],
  contacts: [
    {
      name: '',
      role: '',
      release_status: 'private',
      emails: [],
      phones: [],
      addresses: [],
    },
  ],
  assets: [],
}
