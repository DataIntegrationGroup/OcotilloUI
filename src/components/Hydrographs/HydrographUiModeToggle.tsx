import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  HYDROGRAPH_UI_MODES,
  HYDROGRAPH_UI_MODE_DESCRIPTIONS,
  HYDROGRAPH_UI_MODE_LABELS,
  isHydrographUiModeEnabled,
  type HydrographUiMode,
} from './hydrographUiMode'

/**
 * PrusaSlicer-style mode selector: a single segmented control that governs
 * how much of the corrector is exposed.
 */
export const HydrographUiModeToggle = ({
  mode,
  onChange,
}: {
  mode: HydrographUiMode
  onChange: (mode: HydrographUiMode) => void
}) => (
  <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
    <ToggleButtonGroup
      exclusive
      size="small"
      color="primary"
      value={mode}
      aria-label="Corrector mode"
      onChange={(_event, value: HydrographUiMode | null) => {
        // Exclusive groups emit null when the active button is re-clicked;
        // a mode must always be set, so ignore that.
        if (value) onChange(value)
      }}
    >
      {HYDROGRAPH_UI_MODES.map((value) => (
        <Tooltip key={value} title={HYDROGRAPH_UI_MODE_DESCRIPTIONS[value]}>
          <ToggleButton
            value={value}
            disabled={!isHydrographUiModeEnabled(value)}
            sx={{ px: 1.75, textTransform: 'none' }}
          >
            {HYDROGRAPH_UI_MODE_LABELS[value]}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
    <Typography variant="caption" color="text.secondary">
      {HYDROGRAPH_UI_MODE_DESCRIPTIONS[mode]}
    </Typography>
  </Stack>
)
