/**
 * The only data input of the field sheet page 1 mock-up (BDMS-1504 AC6).
 *
 * Delete this file and the review route stops building — that is the seam
 * between the mock and real data. Nothing here comes from the API: the well has
 * no measurements, no contacts and no date, so the printed sheet is the layout
 * with empty fields, which is what Monday's review is deciding.
 *
 * Placeholder photographs are the five Ocotillo pixel images already in
 * `public/images/pixel`; swapping them for real site photos is not part of the
 * review.
 */
import type { BaseRecord } from '@refinedev/core'
import type { IContact, IWell } from '@/interfaces/ocotillo'

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

const emptyWell = (): IWell =>
  ({
    id: 'fixture-well',
    name: '',
    alternate_ids: [],
    site_notes: [],
    notes: [],
    current_location: null,
  }) as unknown as IWell

export type FieldSheetPageOneFixture = {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: []
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
  observations: [],
  sensorDeployments: [],
  hydrographImage: null,
  sampleMethodsBySampleId: {},
})
