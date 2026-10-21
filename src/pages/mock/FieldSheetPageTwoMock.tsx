import { Box, Stack, Typography } from '@mui/material'
import { Document, PDFViewer } from '@react-pdf/renderer'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { FieldSheetPageTwo } from '@/components/pdf/FieldSheetPageTwo'
import { buildFieldSheetPageTwoFixture } from '@/mock/fieldSheetPageTwo.fixture'

/**
 * Owner leave-behind (page 2) — BDMS-1507.
 *
 * Unlinked route: nothing in the app navigates here, and it reads no API. The
 * whole sheet comes from `@/mock/fieldSheetPageTwo.fixture`; delete that file
 * and this route stops building. Every reviewer question is a query parameter:
 *
 *   /mock/field-sheet/page-2?ose=0
 *
 * `ose=0` renders the no-OSE variant (the `OSE #:` cell omitted). There is no
 * density step — Rob ruled on 2026-10-20 that density is not a feature.
 */

const readOse = (raw: string | null): boolean => raw !== '0'

export const FieldSheetPageTwoMock = () => {
  const [params] = useSearchParams()
  const withOse = readOse(params.get('ose'))

  const fixture = useMemo(
    () => buildFieldSheetPageTwoFixture({ withOse }),
    [withOse]
  )

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h6">Field sheet — page 2</Typography>
        <Typography variant="body2" color="text.secondary">
          BDMS-1507 owner leave-behind. All data is fixture-only: what prints is
          the layout. `?ose=0` omits the OSE cell. No density toggle.
        </Typography>
      </Stack>

      <Box
        sx={{ height: 'calc(100vh - 240px)', minHeight: 480, width: '100%' }}
      >
        <PDFViewer width="100%" height="100%">
          <Document>
            <FieldSheetPageTwo {...fixture} />
          </Document>
        </PDFViewer>
      </Box>
    </Box>
  )
}
