import {
  Paper,
  Box,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { IWell } from '@/interfaces/ocotillo'
import { useEffect, useMemo, useState } from 'react'
import { INCHES_IN_A_FOOT } from '@/constants'
import { SupportedUnits } from '@/config'
import { convertFeetToInches, convertInchesToFeet, formatNumber } from '@/utils'

export const WellPhysicalPropertiesAccordion = ({ well }: { well?: IWell }) => {
  const elevation = well?.current_location?.properties?.elevation
  const normalizedElevation =
    elevation != null && elevation !== 0 ? elevation : null
  const elevationUnit = well?.current_location?.properties?.elevation_unit
  const elevationMethod = well?.current_location?.properties?.elevation_method
  const verticalDatum = well?.current_location?.properties?.vertical_datum

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body1" fontWeight="bold">
          Physical Properties
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <InlineRowWithUnitConversion
            label="Casing Diameter"
            value={well?.well_casing_diameter ?? null}
            unit={well?.well_casing_diameter_unit ?? null}
          />
          <InlineRow
            label="Casing Depth"
            value={`${well?.well_casing_depth?.toFixed(2) || 'N/A'}${well?.well_casing_depth ? ` ${well.well_casing_depth_unit}` : ''}`}
          />
          <InlineRow
            label="Casing Materials"
            value={well?.well_casing_materials?.join(', ') || 'N/A'}
          />
          <InlineRow label="Pump Type" value={well?.well_pump_type || 'N/A'} />
          <InlineRow
            label="Pump Depth"
            value={`${well?.well_pump_depth?.toFixed(2) || 'N/A'}${well?.well_pump_depth ? ` ${well.well_pump_depth_unit}` : ''}`}
          />
          <InlineRow
            label="Elevation"
            value={
              normalizedElevation != null
                ? `${normalizedElevation.toFixed(2)}${elevationUnit ? ` ${elevationUnit}` : ''}`
                : 'N/A'
            }
          />
          <InlineRow
            label="Elevation Method"
            value={elevationMethod || 'N/A'}
          />
          <InlineRow label="Vertical Datum" value={verticalDatum || 'N/A'} />
        </Stack>
      </Box>
    </Paper>
  )
}

const InlineRow = ({ label, value }: { label: string; value: string }) => (
  <Typography variant="body2">
    {label}:{' '}
    <Typography variant="body2" color="text.secondary" component="span">
      {value}
    </Typography>
  </Typography>
)

const InlineRowWithUnitConversion = ({
  label,
  value,
  unit,
}: {
  label: string
  value: number | null | undefined
  unit: SupportedUnits | string | null | undefined
}) => {
  const normalizedUnit: SupportedUnits | null =
    unit === 'in' || unit === 'ft' ? unit : null

  const hasNumericValue = typeof value === 'number' && !Number.isNaN(value)

  const [displayUnit, setDisplayUnit] = useState<SupportedUnits>(() =>
    getDefaultDisplayUnit(value, normalizedUnit)
  )

  useEffect(() => {
    setDisplayUnit(getDefaultDisplayUnit(value, normalizedUnit))
  }, [value, normalizedUnit])

  const displayValue = useMemo(() => {
    if (!hasNumericValue) return null

    if (normalizedUnit === 'in') {
      return displayUnit === 'ft'
        ? convertInchesToFeet(value, { precision: 2 })
        : value
    }

    if (normalizedUnit === 'ft') {
      return displayUnit === 'in'
        ? convertFeetToInches(value, { precision: 2 })
        : value
    }

    return value
  }, [displayUnit, normalizedUnit, value, hasNumericValue])

  const handleUnitChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextUnit: SupportedUnits | null
  ) => {
    if (nextUnit) {
      setDisplayUnit(nextUnit)
    }
  }

  if (!hasNumericValue) {
    return <InlineRow label={label} value="N/A" />
  }

  const shouldShowToggle = normalizedUnit === 'in' || normalizedUnit === 'ft'

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Typography variant="body2">
        {label}:{' '}
        <Typography variant="body2" color="text.secondary" component="span">
          {formatNumber(displayValue, { precision: 2 })}
          {shouldShowToggle
            ? ` ${displayUnit}`
            : normalizedUnit
              ? ` ${normalizedUnit}`
              : ''}
        </Typography>
      </Typography>

      {shouldShowToggle && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={displayUnit}
          onChange={handleUnitChange}
          aria-label={`${label} unit toggle`}
          sx={(theme) => ({
            '& .MuiToggleButton-root': {
              color: 'text.secondary',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : theme.palette.divider}`,
            },
            '& .MuiToggleButton-root + .MuiToggleButton-root': {
              borderLeft: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : theme.palette.divider}`,
              marginLeft: 0,
            },
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              border: `1px solid ${theme.palette.primary.main} !important`,
              '&:hover': { bgcolor: 'primary.dark' },
            },
          })}
        >
          <ToggleButton
            value="in"
            aria-label="inches"
            sx={{ py: 0, fontSize: '0.7rem' }}
          >
            in
          </ToggleButton>
          <ToggleButton
            value="ft"
            aria-label="feet"
            sx={{ py: 0, fontSize: '0.7rem' }}
          >
            ft
          </ToggleButton>
        </ToggleButtonGroup>
      )}
    </Stack>
  )
}

const getDefaultDisplayUnit = (
  value: number | null | undefined,
  normalizedUnit: SupportedUnits | null
): SupportedUnits => {
  const hasNumericValue = typeof value === 'number' && !Number.isNaN(value)

  if (normalizedUnit === 'in' && hasNumericValue) {
    return value >= INCHES_IN_A_FOOT ? 'ft' : 'in'
  }

  return 'ft'
}
