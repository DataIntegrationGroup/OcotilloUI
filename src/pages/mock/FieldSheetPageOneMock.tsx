import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { PDFViewer } from '@react-pdf/renderer'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { FieldCompilationNotesPdf } from '@/components'
import type { IPdfDensity } from '@/interfaces'
import {
  buildFieldSheetPageOneFixture,
  FIXTURE_PHOTO_COUNTS,
} from '@/mock/fieldSheetPageOne.fixture'

/**
 * Review surface for BDMS-1504 — field sheet page 1.
 *
 * Unlinked route: nothing in the app navigates here, and it reads no API. The
 * whole sheet comes from `@/mock/fieldSheetPageOne.fixture`; delete that file and
 * this page stops building (AC6). Every reviewer question is a query parameter so
 * a comment can carry a URL:
 *
 *   /mock/field-sheet/page-1?density=compact&photos=5&notes=column
 *
 * `density` is the BDMS-1503 mechanism the page draws through; `photos` selects
 * one of the four fixtures (0/1/3/5); `notes` is Q5 answered by looking.
 */
const DENSITIES: readonly IPdfDensity[] = ['comfortable', 'standard', 'compact']

type NotesPlacement = 'column' | 'top'

const readDensity = (raw: string | null): IPdfDensity =>
  DENSITIES.includes(raw as IPdfDensity) ? (raw as IPdfDensity) : 'standard'

const readPhotos = (raw: string | null): number => {
  const value = Number(raw)

  return FIXTURE_PHOTO_COUNTS.includes(
    value as (typeof FIXTURE_PHOTO_COUNTS)[number]
  )
    ? value
    : 5
}

const readNotes = (raw: string | null): NotesPlacement =>
  raw === 'top' ? 'top' : 'column'

export const FieldSheetPageOneMock = () => {
  const [params, setParams] = useSearchParams()
  const density = readDensity(params.get('density'))
  const photos = readPhotos(params.get('photos'))
  const notes = readNotes(params.get('notes'))

  const fixture = useMemo(
    () => buildFieldSheetPageOneFixture({ photos }),
    [photos]
  )

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h6">Field sheet — page 1</Typography>
        <Typography variant="body2" color="text.secondary">
          BDMS-1504 mock-up. No data and no date stamp: the fixture supplies
          only the photographs, so what prints is the layout. Page 2 is
          BDMS-1507.
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={3}
        sx={{ flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Density
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={density}
            onChange={(_, value) => value && setParam('density', value)}
          >
            {DENSITIES.map((option) => (
              <ToggleButton key={option} value={option}>
                {option}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Photos
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={photos}
            onChange={(_, value) =>
              value != null && setParam('photos', String(value))
            }
          >
            {FIXTURE_PHOTO_COUNTS.map((count) => (
              <ToggleButton key={count} value={count}>
                {count}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Notes (Q5)
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={notes}
            onChange={(_, value) => value && setParam('notes', value)}
          >
            <ToggleButton value="column">photo column</ToggleButton>
            <ToggleButton value="top">top block</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      <Box
        sx={{ height: 'calc(100vh - 240px)', minHeight: 480, width: '100%' }}
      >
        <PDFViewer width="100%" height="100%">
          <FieldCompilationNotesPdf
            well={fixture.well}
            contacts={fixture.contacts}
            assets={fixture.assets}
            observations={fixture.observations}
            sensorDeployments={fixture.sensorDeployments}
            hydrographImage={fixture.hydrographImage}
            sampleMethodsBySampleId={fixture.sampleMethodsBySampleId}
            density={density}
            showDate={false}
            emptyPlaceholder=" "
            notesPlacement={notes}
            firstPageOnly
          />
        </PDFViewer>
      </Box>
    </Box>
  )
}
