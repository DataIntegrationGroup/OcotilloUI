import type {
  FieldSheetPageTwoData,
  FieldSheetPageTwoMeasurement,
} from '@/components/pdf/FieldSheetPageTwo'

/**
 * Owner leave-behind (page 2) fixture — BDMS-1507.
 *
 * The single data input of the page-2 mock-up. Nothing here comes from the
 * API: the sheet is a print layout for a landowner to take home, so the fixture
 * carries the sample values the design calls for (see
 * `tasks/BDMS-1507/PAGE-2-SPEC.md` element 4 for the five measurement rows).
 *
 * One builder per page mirrors `fieldSheetPageOne.fixture`. The only toggle is
 * `withOse`: it controls whether the `OSE #:` cell prints (spec element 2,
 * conditional) — `false` omits the key entirely so the cell can be absent.
 */

const MEASUREMENT_ROWS: FieldSheetPageTwoMeasurement[] = [
  {
    date: 'Dec 23, 2025',
    dtwFt: 34.86,
    mpHeightFt: 2.54,
    levelStatus: 'Water level not affected',
  },
  { date: 'Jun 6, 2024', dtwFt: 35.14, mpHeightFt: 2.54 },
  {
    date: 'Jun 15, 2023',
    dtwFt: 35.14,
    mpHeightFt: 2.54,
    levelStatus: 'Water level not affected',
  },
  {
    date: 'May 18, 2022',
    dtwFt: 35.66,
    mpHeightFt: 2.54,
    levelStatus: 'Site was pumped recently',
  },
  { date: 'Jun 23, 2021', dtwFt: 34.83, mpHeightFt: 2.54 },
]

const buildWithOse = (): FieldSheetPageTwoData => ({
  siteName: 'Reserve Well 4',
  pointId: 'WL-0085',
  wellDepthFt: '165.00 ft',
  oseNumber: '2024-NMT-0085',
  measurements: MEASUREMENT_ROWS,
  staffName: 'Ethan Mamer',
  staffEmail: 'ethan.mamer@nmt.edu',
  staffPhone: '(575) 555-0142',
})

const buildWithoutOse = (): FieldSheetPageTwoData => {
  const base = buildWithOse()
  const { oseNumber: _oseNumber, ...withoutOse } = base
  return withoutOse
}

/**
 * Build the page-2 owner sheet data. `withOse` selects whether the optional
 * OSE number is present so the grid can omit its cell when there is none.
 * `qrDataUrl`, when supplied, makes the QR block render a code; omit it to keep
 * the `[QR Code]` placeholder (the default the tests and mock route use).
 */
export const buildFieldSheetPageTwoFixture = ({
  withOse,
  qrDataUrl,
}: {
  withOse: boolean
  qrDataUrl?: string
}): FieldSheetPageTwoData => {
  const data = withOse ? buildWithOse() : buildWithoutOse()

  return qrDataUrl === undefined
    ? data
    : { ...data, qrDataUrl }
}
