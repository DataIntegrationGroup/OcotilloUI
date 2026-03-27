import { describe, expect, it, vi } from 'vitest'

vi.mock('@/providers/ocotillo-data-provider', () => ({
  ocotilloDataProvider: {
    getOne: vi.fn(),
    getList: vi.fn(),
    custom: vi.fn(),
  },
}))

import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import {
  loadWellEditForm,
  mapWellEditAggregateToForm,
  mapWellEditFormToPayload,
  submitWellEditForm,
} from '@/pages/ocotillo/thing/well-edit.service'

describe('well edit service', () => {
  it('maps aggregate data into grouped form defaults', () => {
    const form = mapWellEditAggregateToForm({
      well: {
        id: 7,
        name: 'Test Well',
        release_status: 'public',
        first_visit_date: '2024-01-02',
        well_depth: 123,
        hole_depth: 130,
        well_casing_depth: 80,
        well_casing_diameter: 6,
        well_casing_materials: ['steel'],
        well_purposes: ['monitoring'],
        well_construction_notes: null,
        well_completion_date: '2024-02-03',
        well_completion_date_source: 'field',
        well_driller_name: 'Driller',
        well_construction_method: 'drilled',
        well_construction_method_source: 'record',
        well_pump_type: 'submersible',
        well_pump_depth: 44,
        formation_completion_code: 'ABC',
        is_suitable_for_datalogger: true,
        well_status: 'active',
        measuring_point_height: 1.2,
        measuring_point_description: 'cap',
        current_location: {
          geometry: { coordinates: [-106.9, 34.1] },
          properties: {
            name: 'Site 1',
            release_status: 'public',
            notes: [{ content: 'Location note' }],
            elevation: 5000,
            elevation_accuracy: 1.5,
            elevation_method: 'DEM',
            coordinate_accuracy: 20,
            coordinate_method: 'GPS',
          },
        },
        construction_notes: [{ content: 'Construction note' }],
        water_notes: [],
        site_notes: [],
        sampling_procedure_notes: [],
        general_notes: [],
        permissions: [],
      } as any,
      contacts: [
        {
          id: 1,
          name: 'Contact',
          organization: 'Org',
          role: 'owner',
          contact_type: 'person',
          release_status: 'private',
          emails: [
            {
              id: 11,
              email: 'a@example.com',
              email_type: 'Primary',
              release_status: 'private',
            },
          ],
          phones: [
            {
              id: 12,
              phone_number: '555',
              phone_type: 'Mobile',
              release_status: 'private',
            },
          ],
          addresses: [
            {
              id: 13,
              address_line_1: '1 Main',
              city: 'City',
              state: 'NM',
              postal_code: '12345',
              country: 'US',
              address_type: 'Mailing',
              release_status: 'private',
            },
          ],
        } as any,
      ],
      wellScreens: [
        {
          id: 2,
          screen_depth_top: 10,
          screen_depth_bottom: 20,
          screen_type: 'PVC',
          screen_description: 'Screen',
          release_status: 'public',
        } as any,
      ],
    })

    expect(form.well.id).toBe(7)
    expect(form.location.longitude).toBe(-106.9)
    expect(form.location.latitude).toBe(34.1)
    expect(form.location.release_status).toBe(form.well.release_status)
    expect(form.contacts[0].emails[0].id).toBe(11)
    expect(form.wellScreens[0].id).toBe(2)
    expect(form.notes?.construction_notes).toBe('Construction note')
  })

  it('serializes grouped form data into the edit payload', () => {
    const payload = mapWellEditFormToPayload({
      well: {
        id: 7,
        name: 'Test Well',
        release_status: 'public',
        well_casing_materials: [],
        well_purposes: ['monitoring'],
      },
      location: {
        release_status: 'private',
        point: null,
        latitude: 34.1,
        longitude: -106.9,
      },
      contacts: [],
      wellScreens: [],
    } as any)

    expect(payload.well.well_casing_materials).toBeNull()
    expect(payload.well.well_purposes).toEqual(['monitoring'])
    expect(payload.location.release_status).toBe('public')
    expect(payload.location.point).toBe('POINT(-106.9 34.1)')
  })

  it('loads the aggregate using the dedicated service calls', async () => {
    ;(ocotilloDataProvider.getOne as any).mockResolvedValue({
      data: {
        id: 7,
        name: 'Test Well',
        release_status: 'public',
        current_location: {
          geometry: { coordinates: [-106.9, 34.1] },
          properties: {},
        },
      },
    })
    ;(ocotilloDataProvider.getList as any).mockResolvedValue({
      data: [],
      total: 0,
    })

    await loadWellEditForm(7)

    expect(ocotilloDataProvider.getOne).toHaveBeenCalledWith({
      resource: 'thing/water-well',
      id: 7,
    })
    expect(ocotilloDataProvider.getList).toHaveBeenCalled()
  })

  it('translates validation errors from the aggregate endpoint', async () => {
    ;(ocotilloDataProvider.custom as any).mockRejectedValue({
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'well', 'name'], msg: 'required' },
            {
              loc: ['body', 'contacts', 0, 'addresses', 1, 'city'],
              msg: 'required',
            },
          ],
        },
      },
    })

    await expect(
      submitWellEditForm(7, {
        well: { id: 7, name: '', release_status: 'public' },
        location: {},
        contacts: [],
        wellScreens: [],
      } as any)
    ).rejects.toMatchObject({
      fieldErrors: {
        'well.name': ['required'],
        'contacts.0.addresses.1.city': ['required'],
      },
    })
  })
})
