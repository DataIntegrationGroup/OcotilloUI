import { Image, Page, Text, View } from '@react-pdf/renderer'
// Inlined as a data URI: react-pdf cannot read the GIF original, and a
// bundled URL would make the render depend on a fetch completing first.
import nmbgmrLogo from '@/img/NMBGMR.png?inline'
import { Fragment, useMemo } from 'react'
import type { DrinkingWaterStandards } from '@/constants/drinkingWaterStandards'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  type ChemistryResultRow,
  type ChemistryStatus,
  type ContinuousWaterLevelSummary,
  chemistryReportYearOf,
  displayParameterName,
  formatLevelChange,
  formatReportDate,
  formatResultValue,
  groupRowsBySampleDate,
  standardLimitFor,
  resultAgainstLimit,
  latestResultPerParameter,
  pivotFieldParameters,
  reportableResults,
  resultStatus,
  summarizeChemistry,
  type WaterLevelReading,
  waterLevelChangeFt,
} from '@/utils/chemistryReport'
import { formatContactAddress } from '@/utils/FormatAddress'
import { OcotilloDocument } from '../OcotilloDocument'
import { CHEM_REPORT_COLORS as c, chemReportStyles as s } from './styles'

export type ChemistryReportSections = {
  wellInformation: boolean
  waterLevels: boolean
  continuousMonitoring: boolean
  fieldParameters: boolean
  chemistryResults: boolean
  standardsComparison: boolean
  samplingNotes: boolean
  howToRead: boolean
}

export const CHEMISTRY_REPORT_DEFAULT_SECTIONS: ChemistryReportSections = {
  wellInformation: true,
  waterLevels: false,
  continuousMonitoring: false,
  fieldParameters: false,
  chemistryResults: true,
  standardsComparison: true,
  samplingNotes: false,
  howToRead: true,
}

export const CHEMISTRY_REPORT_SECTION_LABELS: Record<
  keyof ChemistryReportSections,
  string
> = {
  wellInformation: 'Well information & construction',
  waterLevels: 'Water level measurements',
  continuousMonitoring: 'Continuous monitoring at a glance',
  fieldParameters: 'Field parameters',
  chemistryResults: 'Chemistry results',
  standardsComparison: 'Drinking water standards & exceedances',
  samplingNotes: 'Sampling & quality assurance notes',
  howToRead: 'How to read this report',
}

type ChemistryReportPdfProps = {
  well?: IWell
  contacts?: readonly IContact[]
  observations: readonly ChemistryResult[]
  /** Drinking water standards from the API's regulatory limits. */
  standards: DrinkingWaterStandards
  waterLevels?: readonly WaterLevelReading[]
  /** The well's logger record, or null/omitted when it has none. */
  continuous?: ContinuousWaterLevelSummary | null
  year: number
  sections?: ChemistryReportSections
  /**
   * PNG data URI of a QR code for the well's Weaver page, built by
   * buildWeaverQrDataUrl. Omitted when the well has no point id; the masthead
   * simply prints without it.
   */
  qrCodeDataUrl?: string | null
}

const SectionHead = ({
  title,
  note,
  startsPage = false,
}: {
  title: string
  note?: string | null
  /** Forces the section onto a page of its own. */
  startsPage?: boolean
}) => (
  // Keeps a heading from being stranded at the foot of a page with its
  // section starting on the next. react-pdf only acts on this when the heading
  // has earlier siblings to stay behind, so a section that can span pages
  // renders its heading outside its own View.
  <View style={s.sectionHeadRow} minPresenceAhead={60} break={startsPage}>
    <Text style={s.sectionHeading}>{title}</Text>
    {note ? <Text style={s.sectionNote}>{note}</Text> : null}
  </View>
)

type StatEntry = {
  label: string
  /** Null drops the stat from the row entirely; it is never printed as a dash. */
  value: string | number | null
  note: string
  tone?: 'danger' | 'warning'
}

/**
 * Point size for a stat's value, stepped down as the string gets longer.
 *
 * A stat is about 83pt of text wide, and the display size is set for short
 * numbers -- "12", "1,107". A depth range like "207.8-210.4 ft" is long enough
 * to wrap at that size, stranding its unit on a line of its own. Stepping the
 * size down keeps every stat on one line without shrinking the short values
 * that carry the page.
 */
const statValueFontSize = (value: string): number => {
  if (value.length >= 13) return 11
  if (value.length >= 11) return 12.5
  if (value.length >= 9) return 14
  return 17
}

const Stat = ({
  label,
  labelLines,
  value,
  note,
  tone,
}: StatEntry & { value: string | number; labelLines: number }) => (
  <View style={s.stat}>
    <Text
      style={[s.statLabel, { minHeight: labelLines * STAT_LABEL_LINE_HEIGHT }]}
    >
      {label}
    </Text>
    <Text
      style={[
        s.statValue,
        { fontSize: statValueFontSize(String(value)) },
        ...(tone === 'danger' ? [s.statValueDanger] : []),
        ...(tone === 'warning' ? [s.statValueWarning] : []),
      ]}
    >
      {String(value)}
    </Text>
    <Text style={s.statNote}>{note}</Text>
  </View>
)

/**
 * Height of one line of a stat label. Every label in a row is given room for
 * as many lines as the longest one, so the values beneath them line up across
 * the row however the labels break.
 */
const STAT_LABEL_LINE_HEIGHT = 7.6

/**
 * A row of stats, minus the ones with nothing behind them. A stat printed as
 * a dash reads to a well owner as a measurement that failed rather than as
 * data the bureau does not hold, so an empty stat is left out and the rest of
 * the row spreads to fill the width.
 */
const StatRow = ({ entries }: { entries: readonly StatEntry[] }) => {
  const populated = entries.filter(
    (entry): entry is StatEntry & { value: string | number } =>
      entry.value != null
  )
  if (!populated.length) return null

  const labelLines = Math.max(
    ...populated.map((entry) => entry.label.split('\n').length)
  )

  return (
    <View style={s.statRow}>
      {populated.map((entry) => (
        <Stat key={entry.label} {...entry} labelLines={labelLines} />
      ))}
    </View>
  )
}

/**
 * Four cells across, so a row of the grid is one line of the well's record.
 * Every entry given is printed; the caller decides what is worth showing.
 */
/** A null value is printed as "Not on file" so every field keeps its place. */
type KvEntry = { label: string; value: string | number | null }

const KvGrid = ({ entries }: { entries: readonly KvEntry[] }) => {
  const perRow = 5
  const rows: (typeof entries)[] = []
  for (let index = 0; index < entries.length; index += perRow) {
    rows.push(entries.slice(index, index + perRow))
  }

  if (!rows.length) return null

  return (
    <View style={s.kvTable}>
      {rows.map((row, rowIndex) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: grid position is the identity
          key={`kv-row-${rowIndex}`}
          style={[
            s.kvRow,
            ...(rowIndex === rows.length - 1 ? [s.kvRowLast] : []),
          ]}
        >
          {Array.from({ length: perRow }, (_, cellIndex) => {
            const entry = row[cellIndex]
            return (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: grid position is the identity
                key={`kv-cell-${rowIndex}-${cellIndex}`}
                style={[
                  s.kvCell,
                  ...(cellIndex === perRow - 1 ? [s.kvCellLast] : []),
                ]}
              >
                {entry ? (
                  <>
                    <Text style={s.kvLabel}>{entry.label}</Text>
                    {entry.value == null ? (
                      <Text style={[s.kvValue, s.kvValueMissing]}>
                        Not on file
                      </Text>
                    ) : (
                      <Text style={s.kvValue}>{String(entry.value)}</Text>
                    )}
                  </>
                ) : null}
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const statusPillStyle = (kind: ChemistryStatus['kind']) => {
  switch (kind) {
    case 'above-mcl':
      return s.pillDanger
    case 'above-smcl':
      return s.pillWarning
    case 'below':
    case 'not-detected':
      return s.pillOk
    default:
      return s.pillNeutral
  }
}

const StatusPill = ({ status }: { status: ChemistryStatus }) => {
  if (status.kind === 'none') {
    return <Text style={s.pillText}>—</Text>
  }

  const pillStyle = statusPillStyle(status.kind)

  return (
    <View style={[s.pill, pillStyle]}>
      <Text style={[s.pillText, pillStyle]}>{status.label}</Text>
    </View>
  )
}

const Legend = () => (
  <View style={s.legendRow}>
    {[
      {
        color: c.dangerTint,
        label: 'Exceeds MCL (Maximum Contaminant Level)',
      },
      {
        color: c.warningTint,
        label: 'Exceeds SMCL (Secondary Maximum Contaminant Level)',
      },
      { color: c.okTint, label: 'Within the limit' },
    ].map((item) => (
      <View key={item.label} style={s.legendItem}>
        <View style={[s.legendSwatch, { backgroundColor: item.color }]} />
        <Text style={s.legendText}>{item.label}</Text>
      </View>
    ))}
    <Text style={s.legendText}>ND — not detected</Text>
  </View>
)

/**
 * Explains the bar column in the terms the column itself cannot fit. Kept
 * beside the legend rather than in the glossary, since a reader looking at the
 * bar is looking at the table.
 */
const BarLegend = () => (
  <View style={s.legendRow}>
    <View style={s.legendItem}>
      <View style={s.barLegendTrack}>
        <View style={[s.barFill, s.barFillOk, { width: '42%' }]} />
        <View style={[s.barLimitTick, { left: '60%' }]} />
      </View>
      <Text style={s.legendText}>
        Result compared to the limit — the bar is your result, the notch is the
        MCL/SMCL for the parameter.
      </Text>
    </View>
  </View>
)

const CHEM_COLUMNS = {
  parameter: { flex: 2 },
  result: { flex: 1.25 },
  mcl: { flex: 1.1 },
  smcl: { flex: 1.1 },
  // Wide enough that "Exceeds EPA recommended limit" breaks at a space rather
  // than being hyphenated mid-word.
  status: { flex: 1.65 },
  comparison: { flex: 1.65 },
} as const

/**
 * Where the limit sits along the bar's track, as a fraction of its width. Not
 * at the far end: a result above the limit has to have somewhere to go, and
 * the notch has to stay visible when it does.
 */
const LIMIT_POSITION = 0.6

/** `1.2x`, `0.45x`, or `12x` -- as many digits as the number needs, no more. */
const formatRatio = (ratio: number): string =>
  ratio >= 10
    ? `${Math.round(ratio)}x`
    : ratio >= 1
      ? `${ratio.toFixed(1)}x`
      : `${ratio.toFixed(2)}x`

/**
 * One result plotted against its own limit, the way a lab report plots a value
 * on a reference range: the filled bar is the result, the notch is the limit.
 *
 * It compares a result only with the published standard for that parameter --
 * never with other wells. Which wells count as nearby depends on depth,
 * aquifer, and proximity to surface water as much as on distance, so an
 * automatic comparison would be asserting something the report cannot
 * support. That is a constraint on what this column may ever plot, not
 * something the report says out loud.
 */
const StandardBar = ({
  row,
  status,
}: {
  row: ChemistryResultRow
  status: ChemistryStatus
}) => {
  const ratio = resultAgainstLimit(row)
  if (ratio == null) return <Text style={s.barEmpty}>—</Text>

  const fillStyle =
    status.kind === 'above-mcl'
      ? s.barFillDanger
      : status.kind === 'above-smcl'
        ? s.barFillWarning
        : s.barFillOk
  const captionStyle =
    status.kind === 'above-mcl'
      ? [s.barCaptionDanger]
      : status.kind === 'above-smcl'
        ? [s.barCaptionWarning]
        : []

  // A result far above its limit runs the bar off the end rather than
  // rescaling the track, which would move the notch out from under the rows
  // above and below it.
  const fill = Math.min(ratio * LIMIT_POSITION, 1)

  return (
    <View>
      <View style={s.barTrack}>
        <View style={[s.barFill, fillStyle, { width: `${fill * 100}%` }]} />
        <View style={[s.barLimitTick, { left: `${LIMIT_POSITION * 100}%` }]} />
      </View>
      <Text style={[s.barCaption, ...captionStyle]}>
        {`${formatRatio(ratio)} the limit`}
      </Text>
    </View>
  )
}

const ChemistryTable = ({
  rows,
  showStandards,
}: {
  rows: readonly ChemistryResultRow[]
  showStandards: boolean
}) => (
  <View style={s.table}>
    <View style={s.th} fixed>
      <Text style={[s.thText, s.td, CHEM_COLUMNS.parameter]}>Parameter</Text>
      <Text style={[s.thText, s.td, CHEM_COLUMNS.result]}>Your result</Text>
      {showStandards ? (
        <>
          <Text style={[s.thText, s.thTextTight, s.td, CHEM_COLUMNS.mcl]}>
            {'Maximum\ncontaminant\nlevel'}
          </Text>
          <Text style={[s.thText, s.thTextTight, s.td, CHEM_COLUMNS.smcl]}>
            {'Secondary\nmaximum\ncontaminant\nlevel'}
          </Text>
          <Text style={[s.thText, s.td, CHEM_COLUMNS.status]}>Status</Text>
          <Text style={[s.thText, s.td, CHEM_COLUMNS.comparison]}>
            Result compared to the standard
          </Text>
        </>
      ) : null}
    </View>

    {groupRowsBySampleDate(rows).map((group) => (
      <Fragment key={group.date}>
        {/* The date is stated once per group, here, rather than on every row.
            Kept with the rows after it, so a date is never left at the foot
            of a page. */}
        <View style={s.dateGroup} minPresenceAhead={40}>
          <Text style={s.dateGroupLabel}>Sample date</Text>
          <Text style={s.dateGroupDate}>
            {formatReportDate(group.sampledOn)}
          </Text>
        </View>
        {group.rows.map((row, index) => {
          const status = resultStatus(row)
          const rowTint =
            status.kind === 'above-mcl'
              ? [s.trDanger]
              : status.kind === 'above-smcl'
                ? [s.trWarning]
                : index % 2 === 1
                  ? [s.trZebra]
                  : []

          return (
            <View key={row.key} style={[s.tr, ...rowTint]} wrap={false}>
              <Text
                style={[
                  s.td,
                  CHEM_COLUMNS.parameter,
                  ...(row.exceeds ? [s.tdStrong] : []),
                ]}
              >
                {displayParameterName(row.parameterName)}
              </Text>
              {/* The unit rides with the value rather than taking a column of
                  its own, which is what the two limit columns are built out
                  of. */}
              <Text
                style={[
                  s.td,
                  s.tdMono,
                  CHEM_COLUMNS.result,
                  ...(row.exceeds ? [s.tdStrong] : []),
                ]}
              >
                {`${formatResultValue(row.value)}${row.value != null && row.unit ? ` ${row.unit}` : ''}`}
              </Text>
              {showStandards ? (
                <>
                  <Text
                    style={[
                      s.td,
                      s.tdMono,
                      CHEM_COLUMNS.mcl,
                      ...(row.standard?.kind === 'MCL' ? [] : [s.tdNoStandard]),
                    ]}
                  >
                    {standardLimitFor(row, 'MCL')}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      s.tdMono,
                      CHEM_COLUMNS.smcl,
                      ...(row.standard?.kind === 'SMCL'
                        ? []
                        : [s.tdNoStandard]),
                    ]}
                  >
                    {standardLimitFor(row, 'SMCL')}
                  </Text>
                  <View style={[s.td, CHEM_COLUMNS.status]}>
                    <StatusPill status={status} />
                  </View>
                  <View style={[s.td, s.barCell, CHEM_COLUMNS.comparison]}>
                    <StandardBar row={row} status={status} />
                  </View>
                </>
              ) : null}
            </View>
          )
        })}
      </Fragment>
    ))}
  </View>
)

const WaterLevelTable = ({
  readings,
}: {
  readings: readonly WaterLevelReading[]
}) => (
  <View style={s.table}>
    <View style={s.th}>
      <Text style={[s.thText, s.td, { flex: 1.4 }]}>Date</Text>
      <Text style={[s.thText, s.td, { flex: 1.2 }]}>Depth to water</Text>
      <Text style={[s.thText, s.td, { flex: 1.3 }]}>Water elevation</Text>
      <Text style={[s.thText, s.td, { flex: 1 }]}>Method</Text>
    </View>
    {readings.map((reading) => (
      <View
        key={reading.key}
        style={[s.tr, ...(reading.isPrior ? [s.trZebra] : [])]}
        wrap={false}
      >
        <Text
          style={[s.td, { flex: 1.4 }, ...(reading.isPrior ? [s.trMuted] : [])]}
        >
          {formatReportDate(reading.measuredOn)}
          {reading.isPrior ? ' (prior)' : ''}
        </Text>
        <Text
          style={[
            s.td,
            s.tdMono,
            { flex: 1.2 },
            ...(reading.isPrior ? [s.trMuted] : []),
          ]}
        >
          {reading.depthToWaterFt == null
            ? '—'
            : `${reading.depthToWaterFt.toFixed(1)} ft${reading.depthReference === 'measuring point' ? ' †' : ''}`}
        </Text>
        <Text
          style={[
            s.td,
            s.tdMono,
            { flex: 1.3 },
            ...(reading.isPrior ? [s.trMuted] : []),
          ]}
        >
          {reading.waterElevationFt == null
            ? '—'
            : `${reading.waterElevationFt.toLocaleString('en-US')} ft`}
        </Text>
        <Text
          style={[s.td, { flex: 1 }, ...(reading.isPrior ? [s.trMuted] : [])]}
        >
          {reading.method}
        </Text>
      </View>
    ))}
  </View>
)

const formatSpan = ([start, end]: [string, string]) =>
  start.slice(0, 10) === end.slice(0, 10)
    ? formatReportDate(start)
    : `${formatReportDate(start)} – ${formatReportDate(end)}`

/** Calendar days from one reading to another, counting both ends. */
const spanDays = (start: string, end: string) =>
  Math.round(
    (Date.parse(end.slice(0, 10)) - Date.parse(start.slice(0, 10))) / 86400000
  ) + 1

/** `Jan 01`, for spans inside a year the label already names. */
const formatMonthDay = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })

/**
 * A logger's year in five numbers. The readings themselves are not printed --
 * an hourly logger writes thousands a year -- only what they add up to.
 */
const ContinuousSummary = ({
  summary,
  year,
}: {
  summary: ContinuousWaterLevelSummary
  year: number
}) => {
  const isCurrentYear = year === new Date().getFullYear()
  const { firstInYear, lastInYear, shallowestInYear, deepestInYear } = summary

  return (
    <>
      <StatRow
        entries={[
          {
            label: `Readings in ${year}`,
            value: summary.recordsInYear.toLocaleString('en-US'),
            note: `${summary.recordsOnFile.toLocaleString('en-US')} on file in total`,
          },
          {
            label: `Period in ${year}`,
            value:
              firstInYear && lastInYear
                ? `${spanDays(firstInYear.measuredOn, lastInYear.measuredOn)} days`
                : null,
            note:
              firstInYear && lastInYear
                ? `${formatMonthDay(firstInYear.measuredOn)} – ${formatMonthDay(lastInYear.measuredOn)}`
                : '',
          },
          {
            label: isCurrentYear
              ? 'Change, year to date'
              : `Change over ${year}`,
            value:
              summary.changeInYearFt == null
                ? null
                : formatLevelChange(summary.changeInYearFt),
            note:
              firstInYear && lastInYear && summary.changeInYearFt != null
                ? // Plain words, not an arrow: Helvetica has no U+2192 and
                  // react-pdf prints a stray glyph in its place.
                  `Depth ${firstInYear.depthToWaterFt.toFixed(1)} to ${lastInYear.depthToWaterFt.toFixed(1)} ft`
                : '',
          },
          {
            label: 'Range in depth',
            value:
              shallowestInYear && deepestInYear
                ? `${shallowestInYear.depthToWaterFt.toFixed(1)}–${deepestInYear.depthToWaterFt.toFixed(1)} ft`
                : null,
            note:
              shallowestInYear && deepestInYear
                ? `High ${formatReportDate(shallowestInYear.measuredOn)} · low ${formatReportDate(deepestInYear.measuredOn)}`
                : '',
          },
          {
            label: 'Period of record',
            value: summary.periodOfRecord
              ? `${chemistryReportYearOf(summary.periodOfRecord[0])}–${chemistryReportYearOf(summary.periodOfRecord[1])}`
              : null,
            note: summary.periodOfRecord
              ? formatSpan(summary.periodOfRecord)
              : '',
          },
        ]}
      />
      <Text style={s.footnote}>
        {[
          'Logged by a pressure transducer left in the well. Depths are to water as logged; a positive change means the water rose, and "high" is the shallowest reading of the year.',
          summary.provisional
            ? `The latest ${year} readings have not been reviewed yet and are provisional.`
            : null,
        ]
          .filter(Boolean)
          .join(' ')}
      </Text>
    </>
  )
}

/** Footnotes to the exceedance stats, naming whose standards they count against. */
const EPA_MCL_NOTE = { marker: '¹', text: 'Based on EPA Standards' }
const EPA_SMCL_NOTE = {
  marker: '²',
  text: 'Based On EPA Standards for Drinking Water',
}

const GLOSSARY_LEFT = [
  {
    term: 'MCL (Maximum Contaminant Level)',
    body: 'The US Environmental Protection Agency (EPA) sets National Primary Drinking Water Regulations, which include legally enforceable and recommended Maximum Contaminant Levels (MCLs) for public drinking water systems. While private wells are not subject to these regulations, these MCLs provide guidance on the suitability of the sampled water for human consumption. EPA action levels are included.',
  },
  {
    term: 'SMCL (Secondary Maximum Contaminant Level)',
    body: 'The US Environmental Protection Agency (EPA) has established non-enforceable National Secondary Drinking Water Regulations, which are guidelines to assist public water systems in managing their drinking water for aesthetic considerations. Concentrations in your water exceeding the secondary regulations may explain variations in taste, color, and odor.',
  },
]

/** Only meaningful alongside a water level section, which is where depths are printed. */
const DEPTH_TERM = 'Depth to water'

const GLOSSARY_RIGHT = [
  {
    term: 'ND (Not detected)',
    body: 'below what the instrument can measure. It does not mean the parameter is absent.',
  },
  {
    term: 'mg/L',
    body: 'milligrams per liter, roughly one part per million.',
  },
  {
    term: DEPTH_TERM,
    body: 'measured downward from the ground surface. Water elevation is the same measurement expressed as height above sea level, so a falling water table shows as a larger depth and a smaller elevation.',
  },
  {
    term: 'Disclaimer',
    body: 'results describe the water on the day it was sampled, at the point it was sampled. Water quality changes with season, pumping, and household plumbing. This report does not certify water as safe to drink.',
  },
]

export const ChemistryReportPdf = ({
  well,
  contacts = [],
  observations,
  standards,
  waterLevels = [],
  continuous = null,
  year,
  sections = CHEMISTRY_REPORT_DEFAULT_SECTIONS,
  qrCodeDataUrl,
}: ChemistryReportPdfProps) => {
  const summary = useMemo(
    () => summarizeChemistry(observations, standards),
    [observations, standards]
  )
  const fieldTable = useMemo(
    () => pivotFieldParameters(summary.fieldParameters),
    [summary.fieldParameters]
  )
  const latest = useMemo(
    () => latestResultPerParameter(summary.labResults),
    [summary.labResults]
  )
  const reportable = useMemo(
    () => reportableResults(latest.rows),
    [latest.rows]
  )
  const levelChange = useMemo(
    () => waterLevelChangeFt(waterLevels),
    [waterLevels]
  )

  const owner = contacts[0]
  const ownerAddress = owner?.addresses?.[0]
    ? formatContactAddress(owner.addresses[0])
    : null
  const locationProperties = well?.current_location?.properties as
    | { county?: string | null; elevation?: number | null }
    | undefined
  const coordinates = well?.current_location?.geometry?.coordinates as
    | number[]
    | undefined
  const osePermit = well?.alternate_ids?.find(
    (link) =>
      link.alternate_organization === 'NMOSE' && link.relation === 'OSEPOD'
  )?.alternate_id

  const measuredDepths = waterLevels.filter(
    (reading) => reading.depthToWaterFt != null
  )
  const measuringPointDepths = measuredDepths.filter(
    (reading) => reading.depthReference === 'measuring point'
  ).length
  const depthFootnote =
    measuringPointDepths === 0
      ? 'Depths are below the ground surface. Water elevation is the land surface elevation less that depth, and is shown only where a surveyed elevation is on file.'
      : measuringPointDepths === measuredDepths.length
        ? '† Depths are below the measuring point, because its height above the ground is not on file, so no water elevation is worked out.'
        : 'Depths are below the ground surface, and water elevation is the land surface elevation less that depth. † Below the measuring point instead, because its height above the ground is not on file; no elevation is worked out for these.'

  // Fields with nothing on file are dropped rather than printed as a dash,
  // and the grid closes up behind them -- each cell carries its own label, so
  // compacting costs nothing in legibility. Filtering here rather than inside
  // KvGrid lets the section tell an empty record from a filled one instead of
  // printing a bare heading.
  const wellFacts: KvEntry[] = (
    [
      { label: 'NMBGMR well point ID', value: well?.name },
      { label: 'Site name', value: well?.site_name },
      { label: 'OSE permit', value: osePermit },
      {
        label: 'Latitude, longitude',
        value:
          coordinates?.[0] && coordinates?.[1]
            ? `${coordinates[1].toFixed(4)}° N, ${Math.abs(coordinates[0]).toFixed(4)}° W`
            : null,
      },
      {
        label: 'Land surface elev.',
        value: locationProperties?.elevation
          ? `${Math.round(locationProperties.elevation).toLocaleString('en-US')} ft above sea level`
          : null,
      },
      {
        label: 'Total depth',
        value: well?.well_depth
          ? `${well.well_depth} ${well.well_depth_unit ?? 'ft'}`
          : null,
      },
      {
        label: 'Casing diameter',
        value: well?.well_casing_diameter
          ? `${Number(well.well_casing_diameter).toFixed(1)} ${well.well_casing_diameter_unit ?? 'in'}`
          : null,
      },
      {
        label: 'Casing depth',
        value: well?.well_casing_depth
          ? `${well.well_casing_depth} ${well.well_casing_depth_unit ?? 'ft'}`
          : null,
      },
      {
        label: 'Completed',
        value: well?.well_completion_date
          ? `${formatReportDate(well.well_completion_date)}${well.well_driller_name ? ` · ${well.well_driller_name}` : ''}`
          : null,
      },
      {
        label: 'Aquifer',
        value: well?.aquifers?.[0]?.aquifer_system,
      },
      {
        label: 'Primary use',
        value: well?.well_purposes?.join(', '),
      },
      { label: 'Well status', value: well?.well_status },
      { label: 'Monitoring', value: well?.monitoring_status },
      {
        label: 'Measuring point',
        value: well?.measuring_point_description,
      },
    ] as { label: string; value: string | number | null | undefined }[]
  ).map((fact) => ({
    label: fact.label,
    value: fact.value == null || fact.value === '' ? null : fact.value,
  }))
  const hasWellFacts = wellFacts.some((fact) => fact.value != null)

  // `year` scopes the water levels and nothing else, so every mention of it --
  // the masthead, the lede, the running footer, the PDF's own title -- belongs
  // to whichever water level section is switched on. With both off the report
  // is the well's chemistry record, which has no reporting year to name, and
  // printing one would invite the reader to date the results by it.
  const showsWaterLevels =
    sections.waterLevels ||
    (sections.continuousMonitoring && continuous != null)

  const glossaryRight = showsWaterLevels
    ? GLOSSARY_RIGHT
    : GLOSSARY_RIGHT.filter((entry) => entry.term !== DEPTH_TERM)

  const wellLabel = well?.name ?? 'Unknown well'
  const hasSamples = summary.rows.length > 0
  const ionBalance = summary.rows.filter(
    (row) => row.parameterName === 'Ion Balance'
  )

  // The reader's guide. Closes page one: a chemistry report carries no water
  // level table, so what precedes it is stable from well to well.
  const howToReadSection = sections.howToRead ? (
    <View style={s.section} wrap={false}>
      <SectionHead title="How to read this report" />
      <View style={s.glossaryRow}>
        <View style={s.glossaryColumn}>
          {GLOSSARY_LEFT.map((entry) => (
            <Text key={entry.term} style={s.glossaryEntry}>
              <Text style={s.glossaryTerm}>{entry.term}</Text>
              {` — ${entry.body}`}
            </Text>
          ))}
        </View>
        <View style={s.glossaryColumn}>
          {glossaryRight.map((entry) => (
            <Text key={entry.term} style={s.glossaryEntry}>
              <Text style={s.glossaryTerm}>{entry.term}</Text>
              {` — ${entry.body}`}
            </Text>
          ))}
          <Text style={s.glossaryEntry}>
            <Text style={s.glossaryTerm}>Questions, or want more data?</Text>
            {
              ' Email nmbg-waterlevel@nmt.edu. You can request the complete record for your well at any time.'
            }
          </Text>
        </View>
      </View>
    </View>
  ) : null

  return (
    <OcotilloDocument
      title={
        showsWaterLevels
          ? `Water Quality Report — ${wellLabel} — ${year}`
          : `Water Quality Report — ${wellLabel}`
      }
      subject="Water Quality Report"
    >
      <Page size="LETTER" style={s.page}>
        {/* ---- Masthead ---- */}
        <View style={s.masthead}>
          <Image style={s.mastheadLogo} src={nmbgmrLogo} />
          <View style={s.mastheadText}>
            <Text style={s.org}>
              New Mexico Bureau of Geology &amp; Mineral Resources · Aquifer
              Mapping and Monitoring Program
            </Text>
            <Text style={s.reportTitle}>Water Quality Report</Text>
            <Text style={s.reportSubtitle}>
              {showsWaterLevels
                ? `Water levels for ${year}  ·  Well `
                : 'Well '}
              <Text style={s.reportSubtitleStrong}>{wellLabel}</Text>
              {well?.site_name ? ` — ${well.site_name}` : ''}
            </Text>
          </View>
          {qrCodeDataUrl ? (
            <View style={s.qrBlock}>
              <Image style={s.qrImage} src={qrCodeDataUrl} />
              <Text style={s.qrCaption}>Scan for this well on Weaver</Text>
            </View>
          ) : null}
        </View>
        <View style={s.ownerBlock}>
          <Text>
            {owner ? (
              <>
                {'Prepared for '}
                <Text style={s.ownerName}>{owner.name}</Text>
                {', owner of record'}
              </>
            ) : (
              'No owner of record on file'
            )}
          </Text>
          <Text style={s.ownerMeta}>
            {[
              ownerAddress,
              `Issued ${formatReportDate(new Date().toISOString())}`,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
        </View>

        <View style={s.mastheadRule} />

        <Text style={s.lede}>
          {[
            'This report summarizes what is on file for your well: how the well is built, what the water was tested for, and how those results compare to EPA drinking water standards.',
            'The chemistry is every result on record, however long ago it was sampled.',
            showsWaterLevels
              ? `The water level measurements cover ${year}.`
              : null,
            'It is provided as a courtesy and is not a certification that the water is safe to drink.',
          ]
            .filter(Boolean)
            .join(' ')}
        </Text>

        {/* ---- At a glance ---- */}
        <View style={s.section}>
          <SectionHead title="At a glance" />
          <StatRow
            entries={[
              {
                label: 'Samples on record',
                value: summary.sampleCount,
                note:
                  summary.sampleDates.length === 0
                    ? 'No samples on file'
                    : summary.sampleDates.length <= 2
                      ? summary.sampleDates
                          .map((date) => formatReportDate(date))
                          .join(' & ')
                      : `${formatReportDate(summary.sampleDates[0])} – ${formatReportDate(summary.sampleDates[summary.sampleDates.length - 1])}`,
              },
              {
                label: 'Parameters tested',
                value: summary.parameterCount,
                note: `${summary.comparedCount} with a standard`,
              },
              {
                // The note names which parameters are over; a count of zero
                // has none to name, and "None" underneath a nought only says
                // the same thing twice.
                // Broken by hand: in a stat this narrow, react-pdf hyphenates
                // "contaminant" mid-word. Read back as one phrase.
                label: `Exceeds Max\nContaminant Level${EPA_MCL_NOTE.marker}`,
                value: summary.mclExceedances.length,
                note: summary.mclExceedances
                  .map((row) => displayParameterName(row.parameterName))
                  .join(', '),
                tone: summary.mclExceedances.length ? 'danger' : undefined,
              },
              {
                label: `Exceeds Drinking\nWater Standards${EPA_SMCL_NOTE.marker}`,
                value: summary.smclExceedances.length,
                note: summary.smclExceedances
                  .map((row) => displayParameterName(row.parameterName))
                  .join(', '),
                tone: summary.smclExceedances.length ? 'warning' : undefined,
              },
              {
                // Dropped rather than shown as "Needs two readings": a well
                // with a single reading has nothing to compare against, which
                // is not a gap the owner can do anything about. Dropped
                // outright when the water level section is off, since it is
                // that section's headline figure.
                label: 'Water level change',
                value:
                  sections.waterLevels && levelChange
                    ? formatLevelChange(levelChange.changeFt)
                    : null,
                note: levelChange
                  ? `vs. ${formatReportDate(levelChange.comparedTo)}`
                  : '',
              },
            ]}
          />
          <Text style={s.statFootnotes}>
            {[EPA_MCL_NOTE, EPA_SMCL_NOTE]
              .map((note) => `${note.marker} ${note.text}`)
              .join('    ')}
          </Text>
        </View>

        {/* ---- Exceedance callouts ---- */}
        {sections.standardsComparison && summary.mclExceedances.length > 0 ? (
          <View style={s.callout} wrap={false}>
            <Text style={s.calloutTitle}>
              {summary.mclExceedances.length === 1
                ? 'One result exceeds the maximum contaminant level (MCL)'
                : `${summary.mclExceedances.length} results exceed the maximum contaminant level (MCL)`}
            </Text>
            {summary.mclExceedances.map((row) => (
              <Text key={`mcl-${row.key}`} style={s.calloutBody}>
                <Text style={s.calloutTitle}>
                  {`${displayParameterName(row.parameterName)} — ${formatResultValue(row.value)} ${row.unit ?? ''}`}
                </Text>
                {` (limit ${row.standard?.limit} ${row.standard?.unit}, sampled ${formatReportDate(row.sampledOn)}).`}
              </Text>
            ))}
            <Text style={s.calloutBullet}>
              · Consider a confirmation sample before making treatment
              decisions.
            </Text>
            <Text style={s.calloutBullet}>
              · The NM Environment Department Drinking Water Bureau advises
              private well owners.
            </Text>
          </View>
        ) : null}

        {sections.standardsComparison && summary.smclExceedances.length > 0 ? (
          <View style={[s.callout, s.calloutWarn]} wrap={false}>
            <Text style={s.calloutTitle}>
              {`${summary.smclExceedances.length} result${summary.smclExceedances.length === 1 ? '' : 's'} ${summary.smclExceedances.length === 1 ? 'exceeds' : 'exceed'} drinking water standards (SMCL) for taste, odor, or color`}
            </Text>
            <Text style={s.calloutBody}>
              {summary.smclExceedances
                .map(
                  (row) =>
                    `${displayParameterName(row.parameterName)} ${formatResultValue(row.value)} ${row.unit ?? ''}`
                )
                .join('; ')}
              . Secondary standards are not health limits — they describe how
              the water looks, tastes, and smells.
            </Text>
          </View>
        ) : null}

        {/* ---- Well information ---- */}
        {sections.wellInformation ? (
          <View style={s.section}>
            <SectionHead title="Well information &amp; construction" />
            {hasWellFacts ? <KvGrid entries={wellFacts} /> : null}
            {hasWellFacts ? null : (
              <Text style={s.emptyNote}>
                No construction details are on file for this well.
              </Text>
            )}
          </View>
        ) : null}

        {/* ---- Water levels ---- */}
        {sections.waterLevels ? (
          <View style={s.section} wrap={false}>
            {/* No summary line: the table below states the dates outright,
                and the change is already in the at-a-glance stat. */}
            <SectionHead title="Water level measurements" />
            {waterLevels.length ? (
              <WaterLevelTable readings={waterLevels} />
            ) : (
              <Text style={s.emptyNote}>
                No water level measurements are on file for this well.
              </Text>
            )}
            {waterLevels.length ? (
              <Text style={s.footnote}>{depthFootnote}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ---- Continuous monitoring ---- */}
        {sections.continuousMonitoring && continuous ? (
          <View style={s.section} wrap={false}>
            <SectionHead
              title="Continuous monitoring at a glance"
              note={
                continuous.lastInYear
                  ? `Last logged ${formatReportDate(continuous.lastInYear.measuredOn)}`
                  : `No logger readings in ${year}`
              }
            />
            <ContinuousSummary summary={continuous} year={year} />
          </View>
        ) : null}

        {howToReadSection}

        {/* ---- Field parameters (page 2) ---- */}
        {sections.fieldParameters ? (
          <View style={s.section} break>
            <SectionHead
              title="Field parameters"
              note="Measured at the wellhead during collection"
            />
            {fieldTable.rows.length ? (
              <View style={s.table}>
                <View style={s.th}>
                  <Text style={[s.thText, s.td, { flex: 2.2 }]}>Parameter</Text>
                  {fieldTable.dates.map((date) => (
                    <Text key={date} style={[s.thText, s.td, { flex: 1.2 }]}>
                      {formatReportDate(date)}
                    </Text>
                  ))}
                  <Text style={[s.thText, s.td, { flex: 0.9 }]}>Unit</Text>
                </View>
                {fieldTable.rows.map((row, index) => (
                  <View
                    key={row.parameterName}
                    style={[s.tr, ...(index % 2 === 1 ? [s.trZebra] : [])]}
                    wrap={false}
                  >
                    <Text style={[s.td, { flex: 2.2 }]}>
                      {displayParameterName(row.parameterName)}
                    </Text>
                    {fieldTable.dates.map((date) => (
                      <Text
                        key={`${row.parameterName}-${date}`}
                        style={[s.td, s.tdMono, { flex: 1.2 }]}
                      >
                        {row.valuesByDate[date] ?? '—'}
                      </Text>
                    ))}
                    <Text style={[s.td, { flex: 0.9 }]}>{row.unit ?? '—'}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={s.emptyNote}>
                No field parameters were recorded for this period.
              </Text>
            )}
          </View>
        ) : null}

        {/* ---- Chemistry results ---- */}
        {sections.chemistryResults ? (
          <>
            {/* Starts a page of its own: the table is the part of the report
                a reader comes back to, and it runs long enough that beginning
                it partway down a page splits it for no reason. Kept outside
                the section's View so that when it does span pages, the heading
                travels with the rows rather than being left behind. */}
            {/* No date note: the table gives every row its own sampled date,
                so a single date over the heading only competes with them. */}
            <SectionHead
              startsPage
              title="Water chemistry &amp; drinking water standards"
            />
            <View style={s.section}>
              {reportable.rows.length ? (
                <>
                  {sections.standardsComparison ? (
                    <Text style={s.disclaimer}>
                      The drinking water limits in this report are set by the
                      U.S. Environmental Protection Agency (EPA). They are
                      guidance only.
                    </Text>
                  ) : null}
                  <ChemistryTable
                    rows={reportable.rows}
                    showStandards={sections.standardsComparison}
                  />
                  <Legend />
                  {sections.standardsComparison ? <BarLegend /> : null}
                </>
              ) : (
                <Text style={s.emptyNote}>
                  {hasSamples
                    ? 'No laboratory results are on file for this well.'
                    : 'No water chemistry has been collected at this well.'}
                </Text>
              )}
            </View>
          </>
        ) : null}

        {/* ---- Sampling notes and glossary (page 3) ---- */}
        {sections.samplingNotes ? (
          <View break>
            {sections.samplingNotes && ionBalance.length ? (
              <View style={s.section}>
                <SectionHead
                  title="Sampling &amp; quality assurance notes"
                  note="Ion balance checks the analysis, not the water"
                />
                <View style={s.table}>
                  <View style={s.th}>
                    <Text style={[s.thText, s.td, { flex: 1.6 }]}>
                      Collected
                    </Text>
                    <Text style={[s.thText, s.td, { flex: 1.2 }]}>
                      Ion balance
                    </Text>
                    <Text style={[s.thText, s.td, { flex: 1 }]}>Check</Text>
                    <Text style={[s.thText, s.td, { flex: 2.6 }]}>
                      Parameters in this sample
                    </Text>
                  </View>
                  {ionBalance.map((row) => {
                    const passes = row.value != null && Math.abs(row.value) <= 5
                    const inSample = summary.rows.filter(
                      (other) => other.sampleKey === row.sampleKey
                    ).length

                    return (
                      <View key={`ion-${row.key}`} style={s.tr} wrap={false}>
                        <Text style={[s.td, { flex: 1.6 }]}>
                          {formatReportDate(row.sampledOn)}
                        </Text>
                        <Text style={[s.td, s.tdMono, { flex: 1.2 }]}>
                          {`${formatResultValue(row.value)} ${row.unit ?? ''}`}
                        </Text>
                        <View style={[s.td, { flex: 1 }]}>
                          <View
                            style={[s.pill, passes ? s.pillOk : s.pillWarning]}
                          >
                            <Text
                              style={[
                                s.pillText,
                                passes ? s.pillOk : s.pillWarning,
                              ]}
                            >
                              {passes ? 'Pass' : 'Review'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[s.td, { flex: 2.6 }]}>
                          {`${inSample} results`}
                        </Text>
                      </View>
                    )
                  })}
                </View>
                <Text style={s.footnote}>
                  A balance within ±5% means the positive and negative ions
                  measured in the sample add up, so the analysis is internally
                  consistent.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text style={s.footerContact}>
            {'Questions: nmbg-waterlevel@nmt.edu'}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `${wellLabel} · Water Quality Report${showsWaterLevels ? ` ${year}` : ''} · Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </OcotilloDocument>
  )
}
