/**
 * The only data input of the field sheet page 1 mock-up (BDMS-1504 AC6).
 *
 * Delete this file and the review route stops building — that is the seam
 * between the mock and real data. Nothing here comes from the API: the well
 * carries two-or-three measurements and site notes so the review surface shows
 * the previous-measurements block and the Site Notes column (item 11 and item
 * 14), still no API, still placeholder photographs. The sheet reads the last
 * two of each — oldest rows simply leave their cell blank — so three are
 * provided to prove exactly that trimming.
 *
 * Placeholder photographs are the five Ocotillo pixel images already in
 * `public/images/pixel`; swapping them for real site photos is not part of the
 * review.
 */
import type { BaseRecord } from '@refinedev/core'
import type { IContact, IWell, IObservation } from '@/interfaces/ocotillo'

export const FIXTURE_PHOTO_COUNTS = [0, 1, 3, 5] as const

const PHOTO_POOL = [
  { file: 'ocotillo-spout.png', label: 'Well head' },
  { file: 'ocotillo-aquifer.png', label: 'Aquifer exposure' },
  { file: 'ocotillo-fountain.png', label: 'Discharge' },
  { file: 'ocotillo-splash.png', label: 'Standing water' },
  { file: 'ocotillo-spring.png', label: 'Spring' },
] as const

const publicUrl = (file: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/images/pixel/${file}`

export const FIXTURE_PHOTOS: BaseRecord[] = PHOTO_POOL.map((photo, index) => ({
  id: `fixture-photo-${index + 1}`,
  label: photo.label,
  name: photo.file,
  mime_type: 'image/png',
  signed_url: publicUrl(photo.file),
}))

/** One site-note line on a well. Only `content` is read by the sheet; the rest
 *  mirror `zNoteResponse` so the note reads as real data (see lastTwoSiteNotes). */
interface SiteNote {
  id: number
  content: string
  created_at?: string | null
}

const emptyWell = (): IWell =>
  ({
    id: 'fixture-well',
    name: '',
    alternate_ids: [],
    site_notes: WELL_SITE_NOTES,
    notes: [],
    current_location: null,
  }) as unknown as IWell

// Oldest to newest; the sheet trims to the last two, so this also proves it.
const WELL_SITE_NOTES: SiteNote[] = [
  { id: 1, content: 'Marker repainted, no change in reading.' },
  { id: 2, content: 'Casing intact; no seepage at the head.' },
  { id: 3, content: 'Pump cycled twice during the visit.' },
]

// Oldest to newest. Shaped as Partial<IObservation>: only the fields the sheet
// reads are set (observation_datetime, depth_to_water_bgs, measuring_point_height,
// level_status / groundwater_level_reason, sample_id), cast through `as unknown
// as` exactly like emptyWell when a mock reasonably omits the rest.
const WELL_OBSERVATIONS: Partial<IObservation>[] = [
  {
    id: 1,
    observation_datetime: '2026-09-18T15:10:00-06:00',
    depth_to_water_bgs: 12.4,
    measuring_point_height: 0.9,
    level_status: 'Steady',
    groundwater_level_reason: null,
    sample_id: 1,
  } as unknown as IObservation,
  {
    id: 2,
    observation_datetime: '2026-10-22T14:35:00-06:00',
    depth_to_water_bgs: 11.9,
    measuring_point_height: 0.9,
    level_status: 'Steady',
    groundwater_level_reason: null,
    sample_id: 2,
  } as unknown as IObservation,
  {
    id: 3,
    observation_datetime: '2026-11-05T13:05:00-07:00',
    depth_to_water_bgs: 11.2,
    measuring_point_height: 0.9,
    level_status: 'Falling',
    groundwater_level_reason: null,
    sample_id: 3,
  } as unknown as IObservation,
]

export type FieldSheetPageOneFixture = {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: Partial<IObservation>[]
  sensorDeployments: []
  hydrographImage: null
  sampleMethodsBySampleId: Record<number, string>
}

export const buildFieldSheetPageOneFixture = ({
  photos,
}: {
  photos: number
}): FieldSheetPageOneFixture => ({
  well: emptyWell(),
  contacts: [],
  assets: FIXTURE_PHOTOS.slice(0, Math.max(0, photos)),
  observations: WELL_OBSERVATIONS,
  sensorDeployments: [],
  hydrographImage: null,
  sampleMethodsBySampleId: { 1: 'Steel tape', 2: 'Steel tape', 3: 'Pressure transducer' },
})
