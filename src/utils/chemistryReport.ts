import {
  compareToStandard,
  type DrinkingWaterStandard,
} from '@/constants/drinkingWaterStandards'
import type {
  ChemistryResult,
  ChemistryResultKind,
} from '@/hooks/useChemistryReportData'
import type { IWell } from '@/interfaces/ocotillo'

export type ChemistryResultRow = {
  key: string
  parameterName: string
  /** Which legacy table the result came from; 'field' was read at the well. */
  resultKind: ChemistryResultKind
  value: number | null
  unit: string | null
  /** When the water was collected, shared by every result in the sample. */
  sampledOn: string
  /**
   * Which sample the result belongs to. Results are grouped and counted by
   * this, never by date: a lab runs one sample's analytes over several days.
   */
  sampleKey: string
  standard?: DrinkingWaterStandard
  exceeds: boolean
}

export type ChemistryReportSummary = {
  rows: ChemistryResultRow[]
  fieldParameters: ChemistryResultRow[]
  labResults: ChemistryResultRow[]
  /** Distinct samples collected in the period. */
  sampleCount: number
  /** Distinct collection dates -- sampling visits -- oldest first. */
  sampleDates: string[]
  parameterCount: number
  comparedCount: number
  mclExceedances: ChemistryResultRow[]
  smclExceedances: ChemistryResultRow[]
}

/**
 * Page size used when pulling one well's chemistry for one reporting year. A
 * year of results for a single well is small; the ceiling only exists so a
 * well with an unusually long parameter list is not silently truncated.
 */
export const CHEMISTRY_REPORT_PAGE_SIZE = 500

/**
 * The API's start_time/end_time window is inclusive of the start and exclusive
 * of the end, so a calendar year runs from Jan 1 to Jan 1 of the next year.
 */
export const chemistryReportYearParams = (year: number) => ({
  start_time: `${year}-01-01T00:00:00`,
  end_time: `${year + 1}-01-01T00:00:00`,
})

/**
 * The same calendar year for the groundwater level endpoints, whose end_time
 * is inclusive (`<=`) rather than exclusive. Ending on Jan 1 there would pull a
 * reading logged at midnight on New Year's Day -- which an hourly logger
 * always has -- into the year before.
 */
export const inclusiveEndYearParams = (year: number) => ({
  start_time: `${year}-01-01T00:00:00`,
  end_time: `${year}-12-31T23:59:59.999`,
})

/**
 * The calendar year a sample belongs to, read in UTC to match the window
 * `chemistryReportYearParams` builds. Reading it locally would file a sample
 * collected Jan 01 under the previous year anywhere west of Greenwich, and the
 * report for that year would then come back empty.
 */
export const chemistryReportYearOf = (value?: string | null): number | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.getUTCFullYear()
}

/** Oldest sample first, parameters alphabetical within a sample date. */
export const sortChemistryResults = (
  observations: readonly ChemistryResult[]
): ChemistryResult[] =>
  [...observations].sort((a, b) => {
    const byDate =
      new Date(a.observation_datetime).getTime() -
      new Date(b.observation_datetime).getTime()
    if (byDate !== 0) return byDate
    return (a.parameter_name ?? '').localeCompare(b.parameter_name ?? '')
  })

/**
 * Sample and completion dates are calendar dates, not instants. The API sends
 * them as UTC (or as a bare `YYYY-MM-DD`, which parses as UTC midnight), so
 * they are formatted in UTC — formatting in the viewer's local zone would
 * print a sample collected Feb 04 as Feb 03 anywhere west of Greenwich.
 */
export const formatReportDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })
}

/**
 * Results are reported at the precision the lab gave us rather than a fixed
 * number of decimals — an arsenic result of 0.012 mg/L must not be rounded to
 * 0.01 mg/L, which is the limit it is being compared against.
 */
export const formatResultValue = (value: number | null): string =>
  value == null ? 'Not detected' : String(value)

/**
 * A result's sample, as a key. Falls back to the collection date for a result
 * with no sample id, which is the best the record allows.
 */
const sampleKeyOf = (observation: ChemistryResult): string =>
  observation.sample_id != null
    ? `sample-${observation.sample_id}`
    : `date-${observation.observation_datetime.slice(0, 10)}`

export const summarizeChemistry = (
  observations: readonly ChemistryResult[]
): ChemistryReportSummary => {
  const rows: ChemistryResultRow[] = observations.map((observation) => {
    const parameterName = observation.parameter_name || 'Unknown'
    const unit = observation.unit ?? null
    const { standard, exceeds } = compareToStandard(
      parameterName,
      observation.value,
      unit
    )

    return {
      key: observation.id,
      parameterName,
      resultKind: observation.result_kind,
      value: observation.value,
      unit,
      sampledOn: observation.observation_datetime,
      sampleKey: sampleKeyOf(observation),
      standard,
      exceeds,
    }
  })

  const sampleDates = Array.from(
    new Set(rows.map((row) => row.sampledOn.slice(0, 10)))
  ).sort()

  return {
    rows,
    fieldParameters: rows.filter((row) => row.resultKind === 'field'),
    labResults: rows.filter((row) => row.resultKind !== 'field'),
    sampleCount: new Set(rows.map((row) => row.sampleKey)).size,
    sampleDates,
    parameterCount: new Set(rows.map((row) => row.parameterName)).size,
    comparedCount: new Set(
      rows.filter((row) => row.standard).map((row) => row.parameterName)
    ).size,
    mclExceedances: rows.filter(
      (row) => row.exceeds && row.standard?.kind === 'MCL'
    ),
    smclExceedances: rows.filter(
      (row) => row.exceeds && row.standard?.kind === 'SMCL'
    ),
  }
}

/**
 * `WL-1187 Vigil Ranch Well` → `chemistry-report-WL-1187-2026.pdf`
 */
export const buildChemistryReportFilename = (
  well: Pick<IWell, 'id' | 'name'> | undefined,
  year: number
): string => {
  const slug = (well?.name ?? `well-${well?.id ?? 'unknown'}`)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '')
  return `chemistry-report-${slug}-${year}.pdf`
}

/**
 * How a result reads against its standard, as the report prints it. Kept as a
 * tagged union rather than a string so the PDF cannot invent a status the
 * comparison logic did not actually produce.
 */
export type ChemistryStatus =
  | { kind: 'above-mcl'; label: 'Above limit' }
  | { kind: 'above-smcl'; label: 'Above SMCL' }
  | { kind: 'below'; label: 'Below limit' }
  | { kind: 'not-detected'; label: 'Not detected' }
  | { kind: 'classification'; label: string }
  | { kind: 'none'; label: '—' }

/**
 * Hardness has no drinking water standard -- it is a nuisance and appliance
 * concern -- so it is reported as the descriptive class the USGS scale gives
 * it instead of as a pass or fail.
 */
const hardnessClass = (value: number): string => {
  if (value < 60) return 'Soft'
  if (value <= 120) return 'Moderately hard'
  if (value <= 180) return 'Hard'
  return 'Very hard'
}

const HARDNESS_PARAMETERS = new Set(['Hardness (CaCO3)', 'Hardness'])

export const resultStatus = (row: ChemistryResultRow): ChemistryStatus => {
  if (row.value == null) return { kind: 'not-detected', label: 'Not detected' }

  if (HARDNESS_PARAMETERS.has(row.parameterName)) {
    return { kind: 'classification', label: hardnessClass(row.value) }
  }

  if (!row.standard) return { kind: 'none', label: '—' }

  if (row.exceeds) {
    return row.standard.kind === 'MCL'
      ? { kind: 'above-mcl', label: 'Above limit' }
      : { kind: 'above-smcl', label: 'Above SMCL' }
  }

  return { kind: 'below', label: 'Below limit' }
}

/** `0.010 mg/L` for a row's limit, or a dash when it has no standard. */
export const formatStandardLimit = (row: ChemistryResultRow): string =>
  row.standard ? String(row.standard.limit) : 'no standard'

/**
 * Field parameters as one row per parameter with a column per sample date,
 * which is how they are read -- the same handful of measurements repeated at
 * each visit, compared across visits.
 */
export type FieldParameterRow = {
  parameterName: string
  unit: string | null
  valuesByDate: Record<string, string>
}

export const pivotFieldParameters = (
  rows: readonly ChemistryResultRow[]
): { dates: string[]; rows: FieldParameterRow[] } => {
  const dates = Array.from(
    new Set(rows.map((row) => row.sampledOn.slice(0, 10)))
  ).sort()

  const byParameter = new Map<string, FieldParameterRow>()
  for (const row of rows) {
    const existing = byParameter.get(row.parameterName) ?? {
      parameterName: row.parameterName,
      unit: row.unit,
      valuesByDate: {},
    }
    existing.valuesByDate[row.sampledOn.slice(0, 10)] = formatResultValue(
      row.value
    )
    existing.unit = existing.unit ?? row.unit
    byParameter.set(row.parameterName, existing)
  }

  return {
    dates,
    rows: [...byParameter.values()].sort((a, b) =>
      a.parameterName.localeCompare(b.parameterName)
    ),
  }
}

/**
 * The results the chemistry table prints: each parameter once, at its most
 * recent value in the period.
 *
 * Not "the latest sample" -- a well is rarely sampled for everything on the
 * same day. Over a year of visits the majors come from one trip and the trace
 * metals from another, so keying the table to a single date drops most of the
 * record and can leave a parameter called out as over its limit with no row to
 * show for it.
 */
export const latestResultPerParameter = (
  rows: readonly ChemistryResultRow[]
): { rows: ChemistryResultRow[]; dateRange: [string, string] | null } => {
  if (rows.length === 0) return { rows: [], dateRange: null }

  const newestByParameter = new Map<string, ChemistryResultRow>()
  for (const row of rows) {
    const existing = newestByParameter.get(row.parameterName)
    if (!existing || row.sampledOn > existing.sampledOn) {
      newestByParameter.set(row.parameterName, row)
    }
  }

  const kept = [...newestByParameter.values()].sort((a, b) => {
    // Exceedances first: the reason the report exists goes at the top.
    const rank = (row: ChemistryResultRow) =>
      row.exceeds ? (row.standard?.kind === 'MCL' ? 0 : 1) : 2
    const byRank = rank(a) - rank(b)
    if (byRank !== 0) return byRank
    return a.parameterName.localeCompare(b.parameterName)
  })

  const days = kept.map((row) => row.sampledOn.slice(0, 10)).sort()

  return { rows: kept, dateRange: [days[0], days[days.length - 1]] }
}

/**
 * What a depth to water is measured down from. The API gives a depth below
 * ground only where the measuring point height is on file; otherwise all there
 * is is the depth below the measuring point (usually the top of casing).
 */
export type DepthReference = 'ground surface' | 'measuring point'

/** One water level reading as the report's table prints it. */
export type WaterLevelReading = {
  key: string
  measuredOn: string
  depthToWaterFt: number | null
  depthReference: DepthReference
  waterElevationFt: number | null
  method: string
  /** True for a reading carried in from before the reporting year. */
  isPrior: boolean
}

export type WaterLevelObservation = {
  id: number | string
  observation_datetime: string
  value?: number | null
  depth_to_water_bgs?: number | null
  sensor_id?: number | null
}

/**
 * Water level readings, newest first, with the water table elevation worked
 * out where it can be.
 *
 * Elevation is the land surface elevation less the depth below ground, so it
 * needs both. A depth measured from the measuring point would put the water
 * table too low by the height of the casing stickup, so those readings get no
 * elevation rather than a wrong one.
 */
export const toWaterLevelReadings = (
  observations: readonly WaterLevelObservation[],
  { elevationFt }: { elevationFt?: number | null } = {}
): WaterLevelReading[] =>
  [...observations]
    .sort(
      (a, b) =>
        new Date(b.observation_datetime).getTime() -
        new Date(a.observation_datetime).getTime()
    )
    .map((observation) => {
      const belowGround = observation.depth_to_water_bgs ?? null
      const depth = belowGround ?? observation.value ?? null

      return {
        key: String(observation.id),
        measuredOn: observation.observation_datetime,
        depthToWaterFt: depth,
        depthReference:
          belowGround != null ? 'ground surface' : 'measuring point',
        waterElevationFt:
          elevationFt != null && belowGround != null
            ? Number((elevationFt - belowGround).toFixed(1))
            : null,
        // The legacy records carry no method field. A reading tied to a sensor
        // came off a transducer; anything else was read by hand.
        method: observation.sensor_id == null ? 'Manual' : 'Transducer',
        isPrior: false,
      }
    })

/**
 * Change in water level between the newest reading and the one before it, as
 * a signed depth change in feet. Negative means the water table fell.
 *
 * Only readings measured from the same reference are compared: a depth below
 * ground against a depth below the measuring point differs by the casing
 * stickup, which would read as a change in the water table.
 */
export const waterLevelChangeFt = (
  readings: readonly WaterLevelReading[]
): { changeFt: number; comparedTo: string } | null => {
  const measured = readings.filter((reading) => reading.depthToWaterFt != null)
  const [newest] = measured
  const previous = measured
    .slice(1)
    .find((reading) => reading.depthReference === newest?.depthReference)
  if (!newest || !previous) return null
  // Depth grows downward, so a deeper reading is a fall in water level.
  const changeFt = Number(
    (
      (previous.depthToWaterFt as number) - (newest.depthToWaterFt as number)
    ).toFixed(1)
  )

  return { changeFt, comparedTo: previous.measuredOn }
}

/** One logged reading, reduced to what the continuous summary prints. */
export type ContinuousReading = { measuredOn: string; depthToWaterFt: number }

/**
 * A logger's record for the reporting year, summarized rather than listed. An
 * hourly logger writes close to 9,000 readings a year; the owner wants to know
 * how much there is, what span it covers, and which way the water went.
 */
export type ContinuousWaterLevelSummary = {
  recordsInYear: number
  recordsOnFile: number
  /** First and last logged reading ever, across every deployment. */
  periodOfRecord: [string, string] | null
  firstInYear: ContinuousReading | null
  lastInYear: ContinuousReading | null
  shallowestInYear: ContinuousReading | null
  deepestInYear: ContinuousReading | null
  /**
   * Water level change from the first reading of the year to the last, in
   * feet. Positive is a rise -- the depth to water got smaller.
   */
  changeInYearFt: number | null
  /** True when the latest reading in the year has not been reviewed. */
  provisional: boolean
}

/** The fields of a transducer reading the summary reads. */
export type TransducerReadingLike = {
  observation: { observation_datetime: string; value: number }
  block?: { review_status?: string | null } | null
}

const toContinuousReading = (
  row: TransducerReadingLike | undefined
): ContinuousReading | null =>
  row
    ? {
        measuredOn: row.observation.observation_datetime,
        depthToWaterFt: row.observation.value,
      }
    : null

/**
 * Builds the summary from single readings picked off the ends of the record --
 * the first and last by time, the shallowest and deepest by value -- so a
 * year of hourly data never has to be downloaded to describe it.
 */
export const summarizeContinuousWaterLevels = ({
  recordsInYear,
  recordsOnFile,
  firstEver,
  lastEver,
  firstInYear,
  lastInYear,
  shallowestInYear,
  deepestInYear,
}: {
  recordsInYear: number
  recordsOnFile: number
  firstEver?: TransducerReadingLike
  lastEver?: TransducerReadingLike
  firstInYear?: TransducerReadingLike
  lastInYear?: TransducerReadingLike
  shallowestInYear?: TransducerReadingLike
  deepestInYear?: TransducerReadingLike
}): ContinuousWaterLevelSummary => {
  const first = toContinuousReading(firstInYear)
  const last = toContinuousReading(lastInYear)

  return {
    recordsInYear,
    recordsOnFile,
    periodOfRecord:
      firstEver && lastEver
        ? [
            firstEver.observation.observation_datetime,
            lastEver.observation.observation_datetime,
          ]
        : null,
    firstInYear: first,
    lastInYear: last,
    shallowestInYear: toContinuousReading(shallowestInYear),
    deepestInYear: toContinuousReading(deepestInYear),
    changeInYearFt:
      first && last && first.measuredOn !== last.measuredOn
        ? Number((first.depthToWaterFt - last.depthToWaterFt).toFixed(2))
        : null,
    provisional:
      lastInYear?.block?.review_status != null &&
      lastInYear.block.review_status !== 'approved',
  }
}

/** `+0.4 ft`, `-1.2 ft`, or `0.0 ft` for a signed change in water level. */
export const formatLevelChange = (changeFt: number): string =>
  `${changeFt > 0 ? '+' : ''}${changeFt.toFixed(1)} ft`

/**
 * Readable labels for legacy analyte symbols the lexicon has no term for.
 *
 * The API deliberately leaves these as symbols -- inventing a parameter name
 * would put vocabulary in `parameter_name` that nothing else in the system
 * knows -- but `CF` on a page handed to a well owner is just noise. None of
 * these carry a drinking water standard, so relabelling them for print cannot
 * cause a limit to be applied to the wrong quantity.
 *
 * `CF` is read as field specific conductance: it arrives in µS/cm alongside a
 * separate laboratory conductivity measurement.
 */
const DISPLAY_LABELS: Record<string, string> = {
  CF: 'Specific conductance (field)',
  // Plain '3', not the subscript: Helvetica has no U+2083 and react-pdf
  // substitutes an italic f for it.
  'Hardness (CaCO3)': 'Hardness (as CaCO3)',
  DO: 'Dissolved oxygen',
  ORP: 'Oxidation-reduction potential',
  TDS: 'Total dissolved solids',
}

export const displayParameterName = (parameterName: string): string =>
  DISPLAY_LABELS[parameterName] ?? parameterName

/**
 * The results the chemistry table prints, and how many it left out.
 *
 * A well can carry a hundred analytes in a year, most of them unregulated
 * trace metals sitting at their detection limit. Printing all of them buries
 * the handful a reader can act on, so the table keeps the ones measured
 * against a standard -- plus hardness, which has no standard but drives
 * appliance and softener decisions -- and says how many others are on file.
 */
export const reportableResults = (
  rows: readonly ChemistryResultRow[]
): { rows: ChemistryResultRow[]; omittedCount: number } => {
  const reportable = rows.filter(
    (row) => row.standard || HARDNESS_PARAMETERS.has(row.parameterName)
  )

  return {
    rows: reportable,
    omittedCount: rows.length - reportable.length,
  }
}
