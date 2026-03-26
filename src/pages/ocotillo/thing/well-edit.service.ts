import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import type { IContact, IWell, IWellScreen } from '@/interfaces/ocotillo'

export interface IWellEditForm {
  well: {
    id: number
    name: string
    release_status: string
    first_visit_date?: string | null
    well_depth?: number | null
    hole_depth?: number | null
    well_casing_depth?: number | null
    well_casing_diameter?: number | null
    well_casing_materials?: string[] | null
    well_purposes?: string[] | null
    well_construction_notes?: string | null
    well_completion_date?: string | null
    well_completion_date_source?: string | null
    well_driller_name?: string | null
    well_construction_method?: string | null
    well_construction_method_source?: string | null
    well_pump_type?: string | null
    well_pump_depth?: number | null
    formation_completion_code?: string | null
    is_suitable_for_datalogger?: boolean | null
    well_status?: string | null
    measuring_point_height?: number | null
    measuring_point_description?: string | null
  }
  location: {
    id?: number
    name?: string | null
    point?: string | null
    latitude?: number | null
    longitude?: number | null
    notes?: string | null
    release_status?: string | null
    elevation?: number | null
    elevation_accuracy?: number | null
    elevation_method?: string | null
    coordinate_accuracy?: number | null
    coordinate_method?: string | null
  }
  contacts: Array<{
    id?: number
    name?: string | null
    organization?: string | null
    role?: string | null
    contact_type?: string | null
    release_status?: string | null
    emails: Array<{
      id?: number
      email: string
      email_type?: string | null
      release_status?: string | null
    }>
    phones: Array<{
      id?: number
      phone_number: string
      phone_type?: string | null
      release_status?: string | null
      country_code?: string | null
    }>
    addresses: Array<{
      id?: number
      address_line_1: string
      address_line_2?: string | null
      city: string
      state: string
      postal_code: string
      country?: string | null
      address_type?: string | null
      release_status?: string | null
    }>
  }>
  wellScreens: Array<{
    id?: number
    screen_depth_top?: number | null
    screen_depth_bottom?: number | null
    screen_type?: string | null
    screen_description?: string | null
    release_status?: string | null
  }>
  notes?: {
    general_notes?: string | null
    construction_notes?: string | null
    measuring_notes?: string | null
    site_notes?: string | null
    water_notes?: string | null
    sampling_procedure_notes?: string | null
  }
}

export interface IWellEditPayload extends IWellEditForm {}

type WellAggregateResponse = {
  well: IWell
  contacts: IContact[]
  wellScreens: IWellScreen[]
}

export type AggregateFieldErrors = Record<string, string[]>

export interface AggregateEditError extends Error {
  status?: number
  fieldErrors?: AggregateFieldErrors
  errors?: AggregateFieldErrors
}

const emptyString = (value: unknown) =>
  typeof value === 'string' ? value : null

const normalizeArray = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[]
  return value.filter((item): item is string => typeof item === 'string')
}

const firstNoteByType = (
  notes: Array<{ note_type: string; content: string }> | undefined,
  noteType: string
) => notes?.find((note) => note.note_type === noteType)?.content ?? null

const joinNotes = (notes: Array<{ content: string }> | undefined) =>
  notes
    ?.map((note) => note.content)
    .filter(Boolean)
    .join('\n\n') ?? null

export const createEmptyWellEditForm = (id = 0): IWellEditForm => ({
  well: {
    id,
    name: '',
    release_status: 'draft',
    first_visit_date: null,
    well_depth: null,
    hole_depth: null,
    well_casing_depth: null,
    well_casing_diameter: null,
    well_casing_materials: [],
    well_purposes: [],
    well_construction_notes: null,
    well_completion_date: null,
    well_completion_date_source: null,
    well_driller_name: null,
    well_construction_method: null,
    well_construction_method_source: null,
    well_pump_type: null,
    well_pump_depth: null,
    formation_completion_code: null,
    is_suitable_for_datalogger: null,
    well_status: null,
    measuring_point_height: null,
    measuring_point_description: null,
  },
  location: {
    name: null,
    point: null,
    latitude: null,
    longitude: null,
    notes: null,
    release_status: 'draft',
    elevation: null,
    elevation_accuracy: null,
    elevation_method: null,
    coordinate_accuracy: null,
    coordinate_method: null,
  },
  contacts: [],
  wellScreens: [],
  notes: {
    general_notes: null,
    construction_notes: null,
    measuring_notes: null,
    site_notes: null,
    water_notes: null,
    sampling_procedure_notes: null,
  },
})

const getNestedNotes = (
  notes: Array<{ note_type: string; content: string }> | undefined
) => ({
  general_notes: firstNoteByType(notes, 'General'),
  construction_notes: firstNoteByType(notes, 'Construction'),
  measuring_notes: firstNoteByType(notes, 'Coordinate'),
  site_notes: firstNoteByType(notes, 'Directions'),
  water_notes: firstNoteByType(notes, 'Water'),
  sampling_procedure_notes: firstNoteByType(notes, 'Sampling Procedure'),
})

export const mapWellEditAggregateToForm = (
  aggregate: WellAggregateResponse
): IWellEditForm => {
  const currentLocation = aggregate.well.current_location as any
  const coordinates = Array.isArray(currentLocation?.geometry?.coordinates)
    ? currentLocation.geometry.coordinates
    : []
  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  const hasCoordinates = Number.isFinite(longitude) && Number.isFinite(latitude)
  const elevation = currentLocation?.properties?.elevation

  return {
    well: {
      id: aggregate.well.id,
      name: aggregate.well.name ?? '',
      release_status: aggregate.well.release_status,
      first_visit_date: aggregate.well.first_visit_date ?? null,
      well_depth: aggregate.well.well_depth ?? null,
      hole_depth: aggregate.well.hole_depth ?? null,
      well_casing_depth: aggregate.well.well_casing_depth ?? null,
      well_casing_diameter: aggregate.well.well_casing_diameter ?? null,
      well_casing_materials: normalizeArray(
        aggregate.well.well_casing_materials
      ),
      well_purposes: normalizeArray(aggregate.well.well_purposes as unknown[]),
      well_construction_notes: joinNotes(
        aggregate.well.construction_notes as any
      ),
      well_completion_date: aggregate.well.well_completion_date ?? null,
      well_completion_date_source: emptyString(
        aggregate.well.well_completion_date_source
      ),
      well_driller_name: emptyString(aggregate.well.well_driller_name),
      well_construction_method: emptyString(
        aggregate.well.well_construction_method
      ),
      well_construction_method_source: emptyString(
        aggregate.well.well_construction_method_source
      ),
      well_pump_type: emptyString(aggregate.well.well_pump_type),
      well_pump_depth: aggregate.well.well_pump_depth ?? null,
      formation_completion_code: emptyString(
        aggregate.well.formation_completion_code
      ),
      is_suitable_for_datalogger:
        aggregate.well.is_suitable_for_datalogger ?? null,
      well_status: emptyString(aggregate.well.well_status),
      measuring_point_height: aggregate.well.measuring_point_height ?? null,
      measuring_point_description: emptyString(
        aggregate.well.measuring_point_description
      ),
    },
    location: {
      id: currentLocation?.properties?.id,
      name: currentLocation?.properties?.name ?? null,
      point: hasCoordinates ? `POINT(${longitude} ${latitude})` : null,
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
      notes: joinNotes(currentLocation?.properties?.notes),
      release_status: currentLocation?.properties?.release_status ?? null,
      elevation: elevation ?? null,
      elevation_accuracy:
        currentLocation?.properties?.elevation_accuracy ?? null,
      elevation_method: currentLocation?.properties?.elevation_method ?? null,
      coordinate_accuracy:
        currentLocation?.properties?.coordinate_accuracy ?? null,
      coordinate_method: currentLocation?.properties?.coordinate_method ?? null,
    },
    contacts: aggregate.contacts.map((contact) => ({
      id: contact.id,
      name: contact.name ?? null,
      organization: contact.organization ?? null,
      role: contact.role ?? null,
      contact_type: contact.contact_type ?? null,
      release_status: contact.release_status ?? null,
      emails: (contact.emails ?? []).map((email) => ({
        id: email.id,
        email: email.email ?? '',
        email_type: email.email_type ?? null,
        release_status: email.release_status ?? null,
      })),
      phones: (contact.phones ?? []).map((phone) => ({
        id: phone.id,
        phone_number: phone.phone_number ?? '',
        phone_type: phone.phone_type ?? null,
        release_status: phone.release_status ?? null,
      })),
      addresses: (contact.addresses ?? []).map((address) => ({
        id: address.id,
        address_line_1: address.address_line_1 ?? '',
        address_line_2: address.address_line_2 ?? null,
        city: address.city ?? '',
        state: address.state ?? '',
        postal_code: address.postal_code ?? '',
        country: address.country ?? 'United States',
        address_type: address.address_type ?? null,
        release_status: address.release_status ?? null,
      })),
    })),
    wellScreens: aggregate.wellScreens.map((screen) => ({
      id: screen.id,
      screen_depth_top: screen.screen_depth_top ?? null,
      screen_depth_bottom: screen.screen_depth_bottom ?? null,
      screen_type: screen.screen_type ?? null,
      screen_description: screen.screen_description ?? null,
      release_status: screen.release_status ?? null,
    })),
    notes: {
      ...getNestedNotes(aggregate.well.general_notes as any),
      construction_notes:
        joinNotes(aggregate.well.construction_notes as any) ?? null,
      site_notes: joinNotes(aggregate.well.site_notes as any) ?? null,
      sampling_procedure_notes:
        joinNotes(aggregate.well.sampling_procedure_notes as any) ?? null,
      water_notes: joinNotes(aggregate.well.water_notes as any) ?? null,
      measuring_notes: joinNotes(currentLocation?.properties?.notes) ?? null,
    },
  }
}

export const mapWellEditFormToPayload = (
  form: IWellEditForm
): IWellEditPayload => ({
  ...form,
  well: {
    ...form.well,
    well_casing_materials: form.well.well_casing_materials?.length
      ? form.well.well_casing_materials
      : null,
    well_purposes: form.well.well_purposes?.length
      ? form.well.well_purposes
      : null,
  },
  location: {
    ...form.location,
    point:
      form.location.point ??
      (form.location.longitude != null && form.location.latitude != null
        ? `POINT(${form.location.longitude} ${form.location.latitude})`
        : null),
  },
})

const toFieldErrors = (
  detail: Array<{ loc: Array<string | number>; msg: string }>
) => {
  const fieldErrors: AggregateFieldErrors = {}

  detail.forEach((issue) => {
    const fieldPath = issue.loc.join('.')
    const cleanFieldPath = fieldPath.startsWith('body.')
      ? fieldPath.substring(5)
      : fieldPath

    if (!cleanFieldPath) return

    if (!fieldErrors[cleanFieldPath]) {
      fieldErrors[cleanFieldPath] = []
    }

    fieldErrors[cleanFieldPath].push(issue.msg)
  })

  return fieldErrors
}

const transformValidationError = (error: any) => {
  if (
    (error?.response?.status === 422 || error?.response?.status === 409) &&
    error?.response?.data?.detail
  ) {
    const fieldErrors = toFieldErrors(error.response.data.detail)
    const transformedError: AggregateEditError = new Error('Validation Error')
    transformedError.status = error.response.status
    transformedError.fieldErrors = fieldErrors
    transformedError.errors = fieldErrors
    return transformedError
  }

  return error
}

const fetchAllPages = async <T>(
  resource: string,
  params: Record<string, unknown>
) => {
  const firstPage = await ocotilloDataProvider.getList({
    resource,
    pagination: { currentPage: 1, pageSize: 1000 },
    meta: { params },
  })

  const totalPages = Math.max(1, Math.ceil(firstPage.total / 1000))

  if (totalPages === 1) {
    return firstPage.data as T[]
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      ocotilloDataProvider.getList({
        resource,
        pagination: { currentPage: index + 2, pageSize: 1000 },
        meta: { params },
      })
    )
  )

  return [
    ...(firstPage.data as T[]),
    ...remainingPages.flatMap((page) => page.data as T[]),
  ]
}

export const loadWellEditForm = async (thingId: number) => {
  const [wellResult, contacts, wellScreens] = await Promise.all([
    ocotilloDataProvider.getOne({
      resource: 'thing/water-well',
      id: thingId,
    }),
    fetchAllPages<IContact>('contact', { thing_id: thingId }),
    fetchAllPages<IWellScreen>('thing/well-screen', { thing_id: thingId }),
  ])

  return mapWellEditAggregateToForm({
    well: wellResult.data as IWell,
    contacts,
    wellScreens,
  })
}

export const submitWellEditForm = async (
  thingId: number,
  form: IWellEditForm
) => {
  const payload = mapWellEditFormToPayload(form)

  try {
    const response = await ocotilloDataProvider.custom({
      url: `thing/water-well/${thingId}/edit`,
      method: 'post',
      payload,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error) {
    throw transformValidationError(error)
  }
}
