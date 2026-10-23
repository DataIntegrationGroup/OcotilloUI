import { Box, Stack, Switch, Typography } from '@mui/material'
import { PDFViewer } from '@react-pdf/renderer'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { FieldCompilationNotesPdf } from '@/components'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'

/**
 * Review surface for BDMS-1504 — field sheet page 1.
 *
 * Unlinked route: nothing in the app navigates here, and it reads no API. The
 * whole sheet comes from `@/mock/fieldSheetPageOne.fixture`; delete that file and
 * this page stops building (AC6). Every reviewer question is a query parameter so
 * a comment can carry a URL:
 *
 *   /mock/field-sheet/page-1?photos=on    five photos (up to PHOTO_SLOT_CAP)
 *   /mock/field-sheet/page-1?photos=off   none — the slot plan fills the space
 *                                         with ruled notes
 *
 * The one control on the page is a "Photos" switch; its state is the `photos`
 * parameter. `on`/`1` = photos, `off`/`0` = none; an absent or otherwise
 * unrecognized value defaults to `on`. Exposing the mode as a parameter lets an
 * automated lane render either state without clicking. There is no density
 * control and no density parameter: the sheet has one fixed style sheet, the
 * dense one (8.5 pt body, 12/14 pt page padding, 5 pt section gaps). The older
 * batch template (`well.tsx` / `createPdfStyles`) still carries its own density
 * option; that stack is not this sheet.
 */
const readPhotos = (raw: string | null): boolean => {
  if (raw === null) return true

  switch (raw.trim().toLowerCase()) {
    case 'off':
    case '0':
      return false
    case 'on':
    case '1':
      return true
    default:
      return true
  }
}

export const FieldSheetPageOneMock = () => {
  const [params, setParams] = useSearchParams()
  const photos = readPhotos(params.get('photos'))

  const fixture = useMemo(
    () => buildFieldSheetPageOneFixture({ photos: photos ? 5 : 0 }),
    [photos]
  )

  const toggle = () => {
    const next = new URLSearchParams(params)
    next.set('photos', photos ? 'off' : 'on')
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
            Photos
          </Typography>
          <Switch
            edge="start"
            checked={photos}
            onChange={toggle}
            inputProps={{ 'aria-label': 'Photos' }}
          />
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
            showDate={false}
            emptyPlaceholder=" "
            firstPageOnly
          />
        </PDFViewer>
      </Box>
    </Box>
  )
}
