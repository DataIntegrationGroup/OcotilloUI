import { Box, Paper, Stack, TextField, Typography } from '@mui/material'
import { ScienceOutlined } from '@mui/icons-material'
import { formatAppDate } from '@/utils/Date'

export type MajorChemistryFeature = {
  id?: string | number
  properties?: Record<string, unknown>
}

export type MajorChemistrySummary = {
  chemistryDate: string
  tds: string
  calcium: string
  magnesium: string
  sodium: string
  potassium: string
  chloride: string
  sulfate: string
  bicarbonate: string
  carbonate: string
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

export const matchesMajorChemistryFeatureToWell = ({
  feature,
  wellName,
}: {
  feature: MajorChemistryFeature
  wellName?: string | null
}): boolean => {
  const properties = feature.properties ?? {}
  const comparableWellName = getComparableName(wellName)
  const comparableName = getComparableName(properties.name)

  if (!comparableWellName) return false

  return comparableName === comparableWellName
}

export const normalizeMajorChemistrySummary = ({
  feature,
}: {
  feature?: MajorChemistryFeature | null
}): MajorChemistrySummary | null => {
  const properties = feature?.properties
  if (!properties) return null

  const chemistryDateRaw =
    getString(properties.latest_chemistry_date) ??
    getString(properties.sample_date)

  return {
    chemistryDate: chemistryDateRaw
      ? formatAppDate(chemistryDateRaw) || chemistryDateRaw
      : 'N/A',
    tds: formatValueWithUnit(properties, 'tds'),
    calcium: formatValueWithUnit(properties, 'calcium'),
    magnesium: formatValueWithUnit(properties, 'magnesium'),
    sodium: formatValueWithUnit(properties, 'sodium'),
    potassium: formatValueWithUnit(properties, 'potassium'),
    chloride: formatValueWithUnit(properties, 'chloride'),
    sulfate: formatValueWithUnit(properties, 'sulfate'),
    bicarbonate: formatValueWithUnit(properties, 'bicarbonate'),
    carbonate: formatValueWithUnit(properties, 'carbonate'),
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

export const MajorChemistryAccordion = ({
  summary,
  isLoading,
}: {
  summary?: MajorChemistrySummary | null
  isLoading: boolean
}) => {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <ScienceOutlined color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Major Chemistry
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {!summary && !isLoading ? (
          <Typography variant="body2" color="text.secondary">
            No major chemistry summary found.
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            <SummaryField
              label="Latest Chemistry Date"
              value={summary?.chemistryDate || 'N/A'}
            />
            <SummaryField label="TDS" value={summary?.tds || 'N/A'} />
            <SummaryField label="Calcium" value={summary?.calcium || 'N/A'} />
            <SummaryField
              label="Magnesium"
              value={summary?.magnesium || 'N/A'}
            />
            <SummaryField label="Sodium" value={summary?.sodium || 'N/A'} />
            <SummaryField
              label="Potassium"
              value={summary?.potassium || 'N/A'}
            />
            <SummaryField
              label="Chloride"
              value={summary?.chloride || 'N/A'}
            />
            <SummaryField label="Sulfate" value={summary?.sulfate || 'N/A'} />
            <SummaryField
              label="Bicarbonate"
              value={summary?.bicarbonate || 'N/A'}
            />
            <SummaryField
              label="Carbonate"
              value={summary?.carbonate || 'N/A'}
            />
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
