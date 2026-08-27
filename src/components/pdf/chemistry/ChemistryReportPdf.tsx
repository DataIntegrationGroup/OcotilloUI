import { Page, Text, View } from '@react-pdf/renderer'
import { useMemo } from 'react'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  type ChemistryResultRow,
  type ChemistryStatus,
  displayParameterName,
  formatReportDate,
  formatResultValue,
  formatStandardLimit,
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
  fieldParameters: boolean
  chemistryResults: boolean
  standardsComparison: boolean
  samplingNotes: boolean
  howToRead: boolean
}

export const CHEMISTRY_REPORT_DEFAULT_SECTIONS: ChemistryReportSections = {
  wellInformation: true,
  waterLevels: true,
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
  waterLevels?: readonly WaterLevelReading[]
  year: number
  sections?: ChemistryReportSections
}

const SectionHead = ({
  title,
  note,
}: {
  title: string
  note?: string | null
}) => (
  <View style={s.sectionHeadRow}>
    <Text style={s.sectionHeading}>{title}</Text>
    {note ? <Text style={s.sectionNote}>{note}</Text> : null}
  </View>
)

const Stat = ({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string | number
  note: string
  tone?: 'danger' | 'warning'
}) => (
  <View style={s.stat}>
    <Text style={s.statLabel}>{label}</Text>
    <Text
      style={[
        s.statValue,
        ...(tone === 'danger' ? [s.statValueDanger] : []),
        ...(tone === 'warning' ? [s.statValueWarning] : []),
      ]}
    >
      {String(value)}
    </Text>
    <Text style={s.statNote}>{note}</Text>
  </View>
)

/** Four cells across, so a row of the grid is one line of the well's record. */
const KvGrid = ({
  entries,
}: {
  entries: { label: string; value: string | number | null | undefined }[]
}) => {
  const perRow = 4
  const rows: (typeof entries)[] = []
  for (let index = 0; index < entries.length; index += perRow) {
    rows.push(entries.slice(index, index + perRow))
  }

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
                    <Text style={s.kvValue}>
                      {entry.value == null || entry.value === ''
                        ? '—'
                        : String(entry.value)}
                    </Text>
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
      { color: c.dangerTint, label: 'Above a health limit (MCL)' },
      { color: c.warningTint, label: 'Above a taste/odour guideline (SMCL)' },
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

const CHEM_COLUMNS = {
  parameter: { flex: 2.4 },
  result: { flex: 1.1 },
  unit: { flex: 0.8 },
  standard: { flex: 1 },
  type: { flex: 0.7 },
  status: { flex: 1.3 },
  measured: { flex: 1.1 },
} as const

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
      <Text style={[s.thText, s.td, CHEM_COLUMNS.unit]}>Unit</Text>
      {showStandards ? (
        <>
          <Text style={[s.thText, s.td, CHEM_COLUMNS.standard]}>Standard</Text>
          <Text style={[s.thText, s.td, CHEM_COLUMNS.type]}>Type</Text>
          <Text style={[s.thText, s.td, CHEM_COLUMNS.status]}>Status</Text>
        </>
      ) : null}
      <Text style={[s.thText, s.td, CHEM_COLUMNS.measured]}>Measured</Text>
    </View>

    {rows.map((row, index) => {
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
          <Text
            style={[
              s.td,
              s.tdMono,
              CHEM_COLUMNS.result,
              ...(row.exceeds ? [s.tdStrong] : []),
            ]}
          >
            {formatResultValue(row.value)}
          </Text>
          <Text style={[s.td, CHEM_COLUMNS.unit]}>{row.unit ?? '—'}</Text>
          {showStandards ? (
            <>
              <Text
                style={[
                  s.td,
                  s.tdMono,
                  CHEM_COLUMNS.standard,
                  ...(row.standard ? [] : [s.tdNoStandard]),
                ]}
              >
                {formatStandardLimit(row)}
              </Text>
              <Text style={[s.td, CHEM_COLUMNS.type]}>
                {row.standard?.kind ?? '—'}
              </Text>
              <View style={[s.td, CHEM_COLUMNS.status]}>
                <StatusPill status={status} />
              </View>
            </>
          ) : null}
          <Text style={[s.td, CHEM_COLUMNS.measured]}>
            {formatReportDate(row.sampledOn)}
          </Text>
        </View>
      )
    })}
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
            : `${reading.depthToWaterFt.toFixed(1)} ft`}
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

const GLOSSARY_LEFT = [
  {
    term: 'MCL (Maximum Contaminant Level)',
    body: 'an enforceable federal health-based limit for public water systems. Private wells are not regulated, but the limit is the best available yardstick.',
  },
  {
    term: 'SMCL (Secondary MCL)',
    body: 'a non-health limit covering taste, odour, colour, and staining. Exceeding it is a nuisance, not a health risk.',
  },
  {
    term: 'ND (Not detected)',
    body: 'below what the instrument can measure. It does not mean the parameter is absent.',
  },
  {
    term: 'mg/L',
    body: 'milligrams per litre, roughly one part per million.',
  },
]

const GLOSSARY_RIGHT = [
  {
    term: 'Ion balance',
    body: 'a laboratory check that the positive and negative ions add up. A passing balance means the analysis is internally consistent.',
  },
  {
    term: 'Depth to water',
    body: 'measured downward from the ground surface. Water elevation is the same measurement expressed as height above sea level, so a falling water table shows as a larger depth and a smaller elevation.',
  },
  {
    term: 'Limitations',
    body: 'results describe the water on the day it was sampled, at the point it was sampled. Water quality changes with season, pumping, and household plumbing. This report does not certify water as safe to drink.',
  },
]

export const ChemistryReportPdf = ({
  well,
  contacts = [],
  observations,
  waterLevels = [],
  year,
  sections = CHEMISTRY_REPORT_DEFAULT_SECTIONS,
}: ChemistryReportPdfProps) => {
  const summary = useMemo(
    () => summarizeChemistry(observations),
    [observations]
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

  const wellLabel = well?.name ?? 'Unknown well'
  const hasSamples = summary.rows.length > 0
  const ionBalance = summary.rows.filter(
    (row) => row.parameterName === 'Ion Balance'
  )

  return (
    <OcotilloDocument
      title={`Annual Water Quality Report — ${wellLabel} — ${year}`}
      subject="Annual Water Quality Report"
    >
      <Page size="LETTER" style={s.page}>
        {/* ---- Masthead ---- */}
        <Text style={s.org}>
          New Mexico Bureau of Geology &amp; Mineral Resources · Aquifer Mapping
          Program
        </Text>
        <Text style={s.reportTitle}>Annual Water Quality Report</Text>
        <Text style={s.reportSubtitle}>
          {`Reporting year ${year}  ·  Well `}
          <Text style={s.reportSubtitleStrong}>{wellLabel}</Text>
          {well?.site_name ? ` — ${well.site_name}` : ''}
        </Text>
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
          {`This report summarizes everything on file for your well for the ${year} calendar year: how the well is built, what the water was tested for, and how those results compare to drinking water standards. It is provided as a courtesy and is not a certification that the water is safe to drink.`}
        </Text>

        {/* ---- At a glance ---- */}
        <View style={s.section}>
          <SectionHead title="At a glance" />
          <View style={s.statRow}>
            <Stat
              label="Samples this year"
              value={summary.sampleDates.length}
              note={
                summary.sampleDates.length === 0
                  ? 'No samples on file'
                  : summary.sampleDates.length <= 2
                    ? summary.sampleDates
                        .map((date) => formatReportDate(date))
                        .join(' & ')
                    : `${formatReportDate(summary.sampleDates[0])} – ${formatReportDate(summary.sampleDates[summary.sampleDates.length - 1])}`
              }
            />
            <Stat
              label="Parameters tested"
              value={summary.parameterCount}
              note={`${summary.comparedCount} with a standard`}
            />
            <Stat
              label="Above health limit"
              value={summary.mclExceedances.length}
              note={
                summary.mclExceedances.length
                  ? summary.mclExceedances
                      .map((row) => displayParameterName(row.parameterName))
                      .join(', ')
                  : 'None'
              }
              tone={summary.mclExceedances.length ? 'danger' : undefined}
            />
            <Stat
              label="Above taste/odour limit"
              value={summary.smclExceedances.length}
              note={
                summary.smclExceedances.length
                  ? summary.smclExceedances
                      .map((row) => displayParameterName(row.parameterName))
                      .join(', ')
                  : 'None'
              }
              tone={summary.smclExceedances.length ? 'warning' : undefined}
            />
            <Stat
              label="Water level change"
              value={
                levelChange
                  ? `${levelChange.changeFt > 0 ? '+' : ''}${levelChange.changeFt.toFixed(1)} ft`
                  : '—'
              }
              note={
                levelChange
                  ? `vs. ${formatReportDate(levelChange.comparedTo)}`
                  : 'Needs two readings'
              }
            />
          </View>
        </View>

        {/* ---- Exceedance callouts ---- */}
        {sections.standardsComparison && summary.mclExceedances.length > 0 ? (
          <View style={s.callout} wrap={false}>
            <Text style={s.calloutTitle}>
              {summary.mclExceedances.length === 1
                ? 'One result was above a federal health limit'
                : `${summary.mclExceedances.length} results were above a federal health limit`}
            </Text>
            {summary.mclExceedances.map((row) => (
              <Text key={`mcl-${row.key}`} style={s.calloutBody}>
                <Text style={s.calloutTitle}>
                  {`${displayParameterName(row.parameterName)} — ${formatResultValue(row.value)} ${row.unit ?? ''}`}
                </Text>
                {` (limit ${row.standard?.limit} ${row.standard?.unit}, measured ${formatReportDate(row.sampledOn)}).`}
                {row.standard?.note ? ` ${row.standard.note}` : ''}
              </Text>
            ))}
            <Text style={s.calloutBullet}>
              · Consider a confirmation sample before making treatment
              decisions.
            </Text>
            <Text style={s.calloutBullet}>
              · The NM Environment Department Drinking Water Bureau advises
              private well owners at (505) 476-8620.
            </Text>
          </View>
        ) : null}

        {sections.standardsComparison && summary.smclExceedances.length > 0 ? (
          <View style={[s.callout, s.calloutWarn]} wrap={false}>
            <Text style={s.calloutTitle}>
              {`${summary.smclExceedances.length} result${summary.smclExceedances.length === 1 ? '' : 's'} above a taste, odour, or staining guideline`}
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
            <SectionHead
              title="Well information &amp; construction"
              note={well?.well_depth_source ?? undefined}
            />
            <KvGrid
              entries={[
                { label: 'Point ID', value: well?.name },
                { label: 'Site name', value: well?.site_name },
                { label: 'County', value: locationProperties?.county },
                { label: 'OSE permit', value: osePermit },
                {
                  label: 'Latitude',
                  value: coordinates?.[1]
                    ? `${coordinates[1].toFixed(4)}° N`
                    : null,
                },
                {
                  label: 'Longitude',
                  value: coordinates?.[0]
                    ? `${Math.abs(coordinates[0]).toFixed(4)}° W`
                    : null,
                },
                {
                  label: 'Land surface elev.',
                  value: locationProperties?.elevation
                    ? `${Math.round(locationProperties.elevation).toLocaleString('en-US')} ft amsl`
                    : null,
                },
                {
                  label: 'Total depth',
                  value: well?.well_depth
                    ? `${well.well_depth} ${well.well_depth_unit ?? 'ft'}`
                    : null,
                },
                {
                  label: 'Casing',
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
              ]}
            />
          </View>
        ) : null}

        {/* ---- Water levels ---- */}
        {sections.waterLevels ? (
          <View style={s.section} wrap={false}>
            <SectionHead
              title="Water level measurements"
              note={
                waterLevels.length
                  ? `${waterLevels.length} reading${waterLevels.length === 1 ? '' : 's'} on file`
                  : undefined
              }
            />
            {waterLevels.length ? (
              <WaterLevelTable readings={waterLevels} />
            ) : (
              <Text style={s.emptyNote}>
                No water level measurements are on file for this well.
              </Text>
            )}
            {waterLevels.length ? (
              <Text style={s.footnote}>
                Depths are measured from the top of casing. Water elevation is
                the land surface elevation less the depth to water, and is shown
                only where a surveyed elevation is on file.
              </Text>
            ) : null}
          </View>
        ) : null}

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
          <View style={s.section}>
            <SectionHead
              title="Water chemistry &amp; drinking water standards"
              note={
                latest.dateRange
                  ? latest.dateRange[0] === latest.dateRange[1]
                    ? `Sampled ${formatReportDate(latest.dateRange[0])}`
                    : `Most recent result per parameter · ${formatReportDate(latest.dateRange[0])} – ${formatReportDate(latest.dateRange[1])}`
                  : undefined
              }
            />
            {reportable.rows.length ? (
              <>
                <ChemistryTable
                  rows={reportable.rows}
                  showStandards={sections.standardsComparison}
                />
                <Legend />
                <Text style={s.footnote}>
                  {[
                    reportable.omittedCount > 0
                      ? `${reportable.omittedCount} further parameters have no drinking water standard to compare against; the full list is on file.`
                      : null,
                    summary.sampleDates.length > 1
                      ? `Each parameter is shown at its most recent ${year} value, across ${summary.sampleDates.length} sampling visits.`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </Text>
              </>
            ) : (
              <Text style={s.emptyNote}>
                {hasSamples
                  ? 'No laboratory results were recorded for this period.'
                  : `No water chemistry was collected at this well during ${year}.`}
              </Text>
            )}
          </View>
        ) : null}

        {/* ---- Sampling notes and glossary (page 3) ---- */}
        {sections.samplingNotes || sections.howToRead ? (
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
                    const day = row.sampledOn.slice(0, 10)
                    const inSample = summary.rows.filter(
                      (other) => other.sampledOn.slice(0, 10) === day
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

            {sections.howToRead ? (
              <View style={s.section}>
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
                    {GLOSSARY_RIGHT.map((entry) => (
                      <Text key={entry.term} style={s.glossaryEntry}>
                        <Text style={s.glossaryTerm}>{entry.term}</Text>
                        {` — ${entry.body}`}
                      </Text>
                    ))}
                    <Text style={s.glossaryEntry}>
                      <Text style={s.glossaryTerm}>
                        Questions, or want more data?
                      </Text>
                      {
                        ' Email aquifermapping@nmt.edu or call (575) 835-5327. You can request the complete record for your well at any time.'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text style={s.footerContact}>
            {'Questions: aquifermapping@nmt.edu · (575) 835-5327'}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `${wellLabel} · Annual Water Quality Report ${year} · Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </OcotilloDocument>
  )
}
