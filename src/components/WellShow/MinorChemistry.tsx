import { Box, Paper, Stack, TextField, Typography } from '@mui/material'
import { ScienceOutlined } from '@mui/icons-material'
import { formatAppDate } from '@/utils/Date'

export type MinorChemistryFeature = {
  id?: string | number
  properties?: Record<string, unknown>
}

export type MinorChemistrySummary = {
  chemistryDate: string
  h2r: string
  o18r: string
  c13r: string
  c14: string
  c14Years: string
  fluoride: string
  bromide: string
  arsenic: string
  uranium: string
  iron: string
  manganese: string
  barium: string
  nitrate: string
  nitrateAsN: string
}

const getString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const getComparableName = (value: unknown): string | null =>
  getString(value)?.toLowerCase() ?? null

const formatValueWithUnit = (
  properties: Record<string, unknown>,
  field: string
): string => {
  const value = properties[field]
  const unit = getString(properties[`${field}_units`])

  const hasNumber = typeof value === 'number' && Number.isFinite(value)
  const hasString = typeof value === 'string' && value.trim().length > 0

  if (!hasNumber && !hasString) return 'N/A'

  const displayValue = hasNumber ? String(value) : String(value).trim()
  return unit ? `${displayValue} ${unit}` : displayValue
}

export const matchesMinorChemistryFeatureToWell = ({
  feature,
  wellName,
}: {
  feature: MinorChemistryFeature
  wellName?: string | null
}): boolean => {
  const properties = feature.properties ?? {}
  const comparableWellName = getComparableName(wellName)
  const comparableName = getComparableName(properties.name)

  if (!comparableWellName) return false

  return comparableName === comparableWellName
}

export const normalizeMinorChemistrySummary = ({
  feature,
}: {
  feature?: MinorChemistryFeature | null
}): MinorChemistrySummary | null => {
  const properties = feature?.properties
  if (!properties) return null

  const chemistryDateRaw =
    getString(properties.latest_chemistry_date) ??
    getString(properties.sample_date)

  return {
    chemistryDate: chemistryDateRaw
      ? formatAppDate(chemistryDateRaw) || chemistryDateRaw
      : 'N/A',
    h2r: formatValueWithUnit(properties, 'h2r'),
    o18r: formatValueWithUnit(properties, 'o18r'),
    c13r: formatValueWithUnit(properties, 'c13r'),
    c14: formatValueWithUnit(properties, 'c14'),
    c14Years: formatValueWithUnit(properties, 'c14_years'),
    fluoride: formatValueWithUnit(properties, 'fluoride'),
    bromide: formatValueWithUnit(properties, 'bromide'),
    arsenic: formatValueWithUnit(properties, 'arsenic'),
    uranium: formatValueWithUnit(properties, 'uranium'),
    iron: formatValueWithUnit(properties, 'iron'),
    manganese: formatValueWithUnit(properties, 'manganese'),
    barium: formatValueWithUnit(properties, 'barium'),
    nitrate: formatValueWithUnit(properties, 'nitrate'),
    nitrateAsN: formatValueWithUnit(properties, 'nitrate_as_n'),
  }
}

const SummaryField = ({ label, value }: { label: string; value: string }) => (
  <TextField
    fullWidth
    size="small"
    label={label}
    value={value}
    slotProps={{
      input: {
        readOnly: true,
      },
      inputLabel: {
        shrink: true,
      },
    }}
  />
)

export const MinorChemistryAccordion = ({
  summary,
  isLoading,
}: {
  summary?: MinorChemistrySummary | null
  isLoading: boolean
}) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <ScienceOutlined color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Minor Chemistry
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {!summary && !isLoading ? (
          <Typography variant="body2" color="text.secondary">
            No minor chemistry summary found.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            <SummaryField
              label="Latest Chemistry Date"
              value={summary?.chemistryDate || 'N/A'}
            />
            <SummaryField label="H2R" value={summary?.h2r || 'N/A'} />
            <SummaryField label="O18R" value={summary?.o18r || 'N/A'} />
            <SummaryField label="C13R" value={summary?.c13r || 'N/A'} />
            <SummaryField label="C14" value={summary?.c14 || 'N/A'} />
            <SummaryField
              label="C14 Years"
              value={summary?.c14Years || 'N/A'}
            />
            <SummaryField
              label="Fluoride"
              value={summary?.fluoride || 'N/A'}
            />
            <SummaryField
              label="Bromide"
              value={summary?.bromide || 'N/A'}
            />
            <SummaryField
              label="Arsenic"
              value={summary?.arsenic || 'N/A'}
            />
            <SummaryField
              label="Uranium"
              value={summary?.uranium || 'N/A'}
            />
            <SummaryField label="Iron" value={summary?.iron || 'N/A'} />
            <SummaryField
              label="Manganese"
              value={summary?.manganese || 'N/A'}
            />
            <SummaryField label="Barium" value={summary?.barium || 'N/A'} />
            <SummaryField
              label="Nitrate"
              value={summary?.nitrate || 'N/A'}
            />
            <SummaryField
              label="Nitrate as N"
              value={summary?.nitrateAsN || 'N/A'}
            />
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
