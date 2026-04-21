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

export const WellPhysicalPropertiesAccordion = ({ well }: { well?: IWell }) => {
  const elevation = well?.current_location?.properties?.elevation
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
            value={well?.well_casing_diameter}
            unit={well.well_casing_diameter_unit}
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
              elevation != null
                ? `${elevation.toFixed(2)}${elevationUnit ? ` ${elevationUnit}` : ''}`
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

const INCHES_IN_A_FOOT = 12

const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100
}

const convertInchesToFeet = (value: number): number => {
  return roundToTwo(value / INCHES_IN_A_FOOT)
}

const convertFeetToInches = (value: number): number => {
  return roundToTwo(value * INCHES_IN_A_FOOT)
}

const formatNumber = (num: number): string => {
  return num.toFixed(2)
}

type SupportedUnit = 'in' | 'ft'

const InlineRowWithUnitConversion = ({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: SupportedUnit | string
}) => {
  const normalizedUnit: SupportedUnit | null =
    unit === 'in' || unit === 'ft' ? unit : null

  const defaultDisplayUnit: SupportedUnit =
    normalizedUnit === 'in' ? (value >= INCHES_IN_A_FOOT ? 'ft' : 'in') : 'ft'

  const [displayUnit, setDisplayUnit] =
    useState<SupportedUnit>(defaultDisplayUnit)

  useEffect(() => {
    const nextDefault: SupportedUnit =
      normalizedUnit === 'in' ? (value >= INCHES_IN_A_FOOT ? 'ft' : 'in') : 'ft'

    setDisplayUnit(nextDefault)
  }, [value, normalizedUnit])

  const displayValue = useMemo(() => {
    if (normalizedUnit === 'in') {
      return displayUnit === 'ft'
        ? convertInchesToFeet(value)
        : roundToTwo(value)
    }

    if (normalizedUnit === 'ft') {
      return displayUnit === 'in'
        ? convertFeetToInches(value)
        : roundToTwo(value)
    }

    return roundToTwo(value)
  }, [displayUnit, normalizedUnit, value])

  const handleUnitChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextUnit: SupportedUnit | null
  ) => {
    if (nextUnit) {
      setDisplayUnit(nextUnit)
    }
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Typography variant="body2">
        {label}:{' '}
        <Typography variant="body2" color="text.secondary" component="span">
          {formatNumber(displayValue)} {displayUnit}
        </Typography>
      </Typography>

      {normalizedUnit && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={displayUnit}
          onChange={handleUnitChange}
          aria-label={`${label} unit toggle`}
        >
          <ToggleButton value="in" aria-label="inches">
            in
          </ToggleButton>
          <ToggleButton value="ft" aria-label="feet">
            ft
          </ToggleButton>
        </ToggleButtonGroup>
      )}
    </Stack>
  )
}
