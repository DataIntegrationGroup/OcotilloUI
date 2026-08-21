import { Page, Text, View } from '@react-pdf/renderer'
import { useMemo } from 'react'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import {
  type ChemistryResultRow,
  formatReportDate,
  formatResultValue,
  summarizeChemistry,
} from '@/utils/chemistryReport'
import { formatContactAddress } from '@/utils/FormatAddress'
import { OcotilloDocument } from '../OcotilloDocument'
import { chemReportStyles as s } from './styles'

export type ChemistryReportSections = {
  wellInformation: boolean
  fieldParameters: boolean
  chemistryResults: boolean
  standardsComparison: boolean
  howToRead: boolean
}

export const CHEMISTRY_REPORT_DEFAULT_SECTIONS: ChemistryReportSections = {
  wellInformation: true,
  fieldParameters: true,
  chemistryResults: true,
  standardsComparison: true,
  howToRead: true,
}

export const CHEMISTRY_REPORT_SECTION_LABELS: Record<
  keyof ChemistryReportSections,
  string
> = {
  wellInformation: 'Well information & construction',
  fieldParameters: 'Field parameters',
  chemistryResults: 'Chemistry results',
  standardsComparison: 'Drinking water standards & exceedances',
  howToRead: 'How to read this report',
}

type ChemistryReportPdfProps = {
  well?: IWell
  contacts?: readonly IContact[]
  observations: readonly ChemistryResult[]
  year: number
  sections?: ChemistryReportSections
}

const SectionHeading = ({ children }: { children: string }) => (
  <Text style={s.sectionHeading}>{children}</Text>
)

const KeyValue = ({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) => (
  <View style={s.kvCell}>
    <Text style={s.kvLabel}>{label}</Text>
    <Text style={s.kvValue}>
      {value === null || value === undefined || value === '' ? '—' : value}
    </Text>
  </View>
)

const ResultsTable = ({
  rows,
  showStandard,
}: {
  rows: readonly ChemistryResultRow[]
  showStandard: boolean
}) => (
  <View style={s.table}>
    <View style={s.tableHeaderRow}>
      <Text style={[s.th, s.colParameter]}>Parameter</Text>
      <Text style={[s.th, s.colValue]}>Result</Text>
      <Text style={[s.th, s.colUnit]}>Unit</Text>
      {showStandard ? (
        <>
          <Text style={[s.th, s.colStandard]}>Standard</Text>
          <Text style={[s.th, s.colStatus]}>Status</Text>
        </>
      ) : null}
      <Text style={[s.th, s.colDate]}>Sampled</Text>
    </View>
    {rows.map((row) => {
      const emphasis = !row.exceeds
        ? undefined
        : row.standard?.kind === 'MCL'
          ? s.tdExceeds
          : s.tdSecondary

      return (
        <View key={row.key} style={s.tableRow} wrap={false}>
          <Text style={[s.td, s.colParameter]}>{row.parameterName}</Text>
          <Text style={[s.td, s.colValue, ...(emphasis ? [emphasis] : [])]}>
            {formatResultValue(row.value)}
          </Text>
          <Text style={[s.td, s.colUnit]}>{row.unit ?? '—'}</Text>
          {showStandard ? (
            <>
              <Text style={[s.td, s.colStandard]}>
                {row.standard
                  ? `${row.standard.limit} ${row.standard.unit}`
                  : '—'}
              </Text>
              <Text
                style={[s.td, s.colStatus, ...(emphasis ? [emphasis] : [])]}
              >
                {/* A non-detect was never measured against the limit, so it
                    is not reported as having passed one. */}
                {row.value == null
                  ? '—'
                  : !row.standard
                    ? 'No standard'
                    : row.exceeds
                      ? `Above ${row.standard.kind}`
                      : 'Within limit'}
              </Text>
            </>
          ) : null}
          <Text style={[s.td, s.colDate]}>
            {formatReportDate(row.sampledOn)}
          </Text>
        </View>
      )
    })}
  </View>
)

export const ChemistryReportPdf = ({
  well,
  contacts = [],
  observations,
  year,
  sections = CHEMISTRY_REPORT_DEFAULT_SECTIONS,
}: ChemistryReportPdfProps) => {
  const summary = useMemo(
    () => summarizeChemistry(observations),
    [observations]
  )

  const owner = contacts[0]
  const ownerAddress = owner?.addresses?.[0]
    ? formatContactAddress(owner.addresses[0])
    : null
  const locationProperties = well?.current_location?.properties as
    | { county?: string | null; elevation?: number | null }
    | undefined

  const wellLabel = well?.name ?? 'Unknown well'
  const hasSamples = summary.rows.length > 0

  return (
    <OcotilloDocument
      title={`Annual Water Quality Report — ${wellLabel} — ${year}`}
      subject="Annual Water Quality Report"
    >
      <Page size="LETTER" style={s.page}>
        <View style={s.masthead}>
          <Text style={s.org}>
            New Mexico Bureau of Geology &amp; Mineral Resources · Aquifer
            Mapping Program
          </Text>
          <Text style={s.reportTitle}>Annual Water Quality Report</Text>
          <Text style={s.reportSubtitle}>
            {`Reporting year ${year}  ·  Well ${wellLabel}`}
            {well?.site_name ? ` — ${well.site_name}` : ''}
          </Text>
          <View style={s.ownerBlock}>
            <Text>
              {owner
                ? `Prepared for ${owner.name}, owner of record`
                : 'No owner of record on file'}
            </Text>
            {ownerAddress ? <Text style={s.dim}>{ownerAddress}</Text> : null}
            <Text style={s.dim}>
              {`Issued ${formatReportDate(new Date().toISOString())}`}
            </Text>
          </View>
        </View>

        <Text style={s.lede}>
          This report summarizes the water quality data on file for your well
          for the {year} calendar year, and how those results compare to federal
          drinking water standards. It is provided as a courtesy and is not a
          certification that the water is safe to drink.
        </Text>

        <View style={s.section}>
          <SectionHeading>At a Glance</SectionHeading>
          <View style={s.statRow}>
            <View style={s.stat}>
              <Text style={s.statLabel}>Samples this year</Text>
              <Text style={s.statValue}>{summary.sampleDates.length}</Text>
              <Text style={s.statNote}>
                {summary.sampleDates.length
                  ? summary.sampleDates.map(formatReportDate).join(' · ')
                  : 'No samples on file'}
              </Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>Parameters tested</Text>
              <Text style={s.statValue}>{summary.parameterCount}</Text>
              <Text style={s.statNote}>
                {`${summary.comparedCount} with a standard`}
              </Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>Above health limit</Text>
              <Text
                style={[
                  s.statValue,
                  ...(summary.mclExceedances.length ? [s.tdExceeds] : []),
                ]}
              >
                {summary.mclExceedances.length}
              </Text>
              <Text style={s.statNote}>MCL</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>Above taste/odor limit</Text>
              <Text
                style={[
                  s.statValue,
                  ...(summary.smclExceedances.length ? [s.tdSecondary] : []),
                ]}
              >
                {summary.smclExceedances.length}
              </Text>
              <Text style={s.statNote}>SMCL</Text>
            </View>
          </View>
        </View>

        {sections.standardsComparison && summary.mclExceedances.length > 0 ? (
          <View style={s.section}>
            {summary.mclExceedances.map((row) => (
              <View key={`mcl-${row.key}`} style={s.callout} wrap={false}>
                <Text style={s.calloutTitle}>
                  {`${row.parameterName} was above a federal health limit`}
                </Text>
                <Text style={s.calloutBody}>
                  {`${formatResultValue(row.value)} ${row.unit ?? ''} measured ${formatReportDate(
                    row.sampledOn
                  )} — the limit is ${row.standard?.limit} ${row.standard?.unit}.`}
                  {row.standard?.note ? ` ${row.standard.note}` : ''}
                </Text>
                <Text style={s.calloutBody}>
                  The NM Environment Department Drinking Water Bureau advises
                  private well owners at (505) 476-8620.
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {sections.standardsComparison && summary.smclExceedances.length > 0 ? (
          <View style={s.section}>
            <View style={[s.callout, s.calloutWarn]} wrap={false}>
              <Text style={[s.calloutTitle, s.calloutTitleWarn]}>
                {`${summary.smclExceedances.length} result(s) above a taste, odor, or staining guideline`}
              </Text>
              <Text style={s.calloutBody}>
                {summary.smclExceedances
                  .map(
                    (row) =>
                      `${row.parameterName} ${formatResultValue(row.value)} ${row.unit ?? ''}`
                  )
                  .join('; ')}
                . Secondary standards are not health limits — they describe how
                the water looks, tastes, and smells.
              </Text>
            </View>
          </View>
        ) : null}

        {sections.wellInformation ? (
          <View style={s.section}>
            <SectionHeading>Well Information &amp; Construction</SectionHeading>
            <View style={s.kvRow}>
              <KeyValue label="Point ID" value={well?.name} />
              <KeyValue label="Site name" value={well?.site_name} />
              <KeyValue label="County" value={locationProperties?.county} />
              <KeyValue
                label="Well depth"
                value={
                  well?.well_depth
                    ? `${well.well_depth} ${well.well_depth_unit ?? 'ft'}`
                    : null
                }
              />
              <KeyValue
                label="Hole depth"
                value={
                  well?.hole_depth
                    ? `${well.hole_depth} ${well.hole_depth_unit ?? 'ft'}`
                    : null
                }
              />
              <KeyValue
                label="Casing diameter"
                value={
                  well?.well_casing_diameter
                    ? `${well.well_casing_diameter} ${well.well_casing_diameter_unit ?? 'in'}`
                    : null
                }
              />
              <KeyValue
                label="Completed"
                value={formatReportDate(well?.well_completion_date)}
              />
              <KeyValue label="Driller" value={well?.well_driller_name} />
              <KeyValue
                label="Aquifer system"
                value={well?.aquifers?.[0]?.aquifer_system}
              />
            </View>
          </View>
        ) : null}

        {sections.fieldParameters ? (
          <View style={s.section}>
            <SectionHeading>Field Parameters</SectionHeading>
            {summary.fieldParameters.length ? (
              <ResultsTable
                rows={summary.fieldParameters}
                showStandard={false}
              />
            ) : (
              <Text style={s.emptyNote}>
                No field parameters were recorded for this period.
              </Text>
            )}
          </View>
        ) : null}

        {sections.chemistryResults ? (
          <View style={s.section} break={summary.labResults.length > 12}>
            <SectionHeading>Laboratory Results</SectionHeading>
            {summary.labResults.length ? (
              <ResultsTable
                rows={summary.labResults}
                showStandard={sections.standardsComparison}
              />
            ) : (
              <Text style={s.emptyNote}>
                {hasSamples
                  ? 'No laboratory results were recorded for this period.'
                  : `No water chemistry was collected at this well during ${year}.`}
              </Text>
            )}
          </View>
        ) : null}

        {sections.howToRead ? (
          <View style={s.section} break>
            <SectionHeading>How to Read This Report</SectionHeading>
            <Text style={s.bullet}>
              MCL (Maximum Contaminant Level) — an enforceable, health-based
              federal limit for public water systems. Private wells are not
              regulated, but the limit is the best available yardstick.
            </Text>
            <Text style={s.bullet}>
              SMCL (Secondary Maximum Contaminant Level) — a non-enforceable
              guideline for taste, odor, color, and staining. Exceeding it is a
              nuisance, not a health finding.
            </Text>
            <Text style={s.bullet}>
              &quot;Not detected&quot; means the laboratory did not measure the
              parameter above its detection limit; it does not mean the
              parameter is absent.
            </Text>
            <Text style={s.bullet}>
              Parameters shown with no standard have no federal drinking water
              limit. They are reported for completeness.
            </Text>
            <Text style={s.bullet}>
              A single sample describes the well on the day it was collected.
              Water quality changes over time; repeat sampling is the only way
              to see a trend.
            </Text>
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {`${wellLabel} · Annual Water Quality Report ${year}`}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </OcotilloDocument>
  )
}
