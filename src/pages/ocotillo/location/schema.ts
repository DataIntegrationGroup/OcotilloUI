import * as yup from 'yup'

export const LocationSchema = yup.object({
    id: yup.number().required(),
    name: yup.string().nullable(), 
    notes: yup.string().nullable(), 
    point: yup.string().required(), 
    release_status: yup.string().nullable(), 
    created_at: yup.string().required(),
}).noUnknown(true)