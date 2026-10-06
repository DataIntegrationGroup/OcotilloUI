import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { PDFViewer } from '@react-pdf/renderer'
import { useOne } from '@refinedev/core'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChemistryReportDownloadButton } from '@/components/Button'
import { OcotilloPageTitle } from '@/components/OcotilloPageHeader'
import {
  CHEMISTRY_REPORT_DEFAULT_SECTIONS,
  CHEMISTRY_REPORT_SECTION_LABELS,
  ChemistryReportPdf,
  type ChemistryReportSections,
  buildWeaverQrDataUrl,
} from '@/components/pdf/chemistry'
import { useChemistryReportData } from '@/hooks'
import type { IWell } from '@/interfaces/ocotillo'

const parseYearParam = (value: string | null): number | undefined => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 1900 ? parsed : undefined
}

/**
 * Previews one well's report and hands it over as a PDF.
 *
 * The well and the reporting year come from the link that got here -- the
 * report option on a well's details page -- rather than from pickers. That
 * page already knows which well is being looked at, and it works out the year
 * from the well's own record, so choosing either again here could only
 * disagree with it. The only thing left to decide is which sections to
 * include.
 */
export const ChemistryReportExport = () => {
  const [searchParams] = useSearchParams()
  const linkedThingId = searchParams.get('thing_id')
  // Scopes the water levels only; the chemistry is the well's whole record.
  const year =
    parseYearParam(searchParams.get('year')) ?? new Date().getFullYear()

  const { result: linkedWell } = useOne<IWell>({
    resource: 'thing-well',
    id: linkedThingId ?? undefined,
    queryOptions: { enabled: Boolean(linkedThingId) },
  })

  const [sections, setSections] = useState<ChemistryReportSections>(
    CHEMISTRY_REPORT_DEFAULT_SECTIONS
  )

  const {
    well,
    contacts,
    observations,
    waterLevels,
    continuous,
    isLoading,
    isError,
  } = useChemistryReportData({ thingId: linkedThingId ?? undefined, year })

  const toggleSection = (key: keyof ChemistryReportSections) =>
    setSections((previous) => ({ ...previous, [key]: !previous[key] }))

  // The PDF renders synchronously but encoding the QR is async, so it is built
  // here and handed down. Null until it resolves; the masthead copes.
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    buildWeaverQrDataUrl(well?.name).then((dataUrl) => {
      if (!cancelled) setQrCodeDataUrl(dataUrl)
    })
    return () => {
      cancelled = true
    }
  }, [well?.name])

  const isReady = Boolean(linkedThingId) && !isLoading && !isError
  const wellLabel = (linkedWell as IWell | undefined)?.name ?? well?.name

  return (
    <Box>
      <OcotilloPageTitle
        title={
          wellLabel ? `Chemistry Report — ${wellLabel}` : 'Chemistry Report'
        }
      >
        <ChemistryReportDownloadButton
          well={well}
          contacts={contacts}
          observations={observations}
          waterLevels={waterLevels}
          continuous={continuous}
          year={year}
          sections={sections}
          disabled={!isReady}
        />
      </OcotilloPageTitle>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {`An owner-facing water quality report: the well's whole chemistry record, with water level measurements for ${year}. Multi-well runs, delivery, and scheduling are not implemented yet.`}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          component="div"
          sx={{ mb: 0.5 }}
        >
          Sections
        </Typography>
        {/* One column on a phone, two on a tablet, four on a desktop, so the
            labels stay on one line each instead of wrapping into a block of
            checkboxes that is hard to scan. */}
        <Grid container columnSpacing={2}>
          {(
            Object.keys(
              CHEMISTRY_REPORT_SECTION_LABELS
            ) as (keyof ChemistryReportSections)[]
          ).map((key) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControlLabel
                sx={{ width: '100%' }}
                control={
                  <Checkbox
                    size="small"
                    checked={sections[key]}
                    onChange={() => toggleSection(key)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {CHEMISTRY_REPORT_SECTION_LABELS[key]}
                  </Typography>
                }
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load chemistry data for this well.
        </Alert>
      ) : null}

      {linkedThingId && !isLoading && observations.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {`No water chemistry is on file for ${wellLabel ?? 'this well'}. The report still generates, marked as having no results.`}
        </Alert>
      ) : null}

      <Box sx={{ width: '100%', height: '80vh' }}>
        {!linkedThingId ? (
          <Paper
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <Typography color="text.secondary" align="center">
              Open a well, then choose Chemistry report from its PDF menu to
              preview it here.
            </Typography>
          </Paper>
        ) : isLoading ? (
          <Skeleton variant="rectangular" height="100%" />
        ) : (
          <PDFViewer width="100%" height="100%" showToolbar>
            <ChemistryReportPdf
              well={well}
              contacts={contacts}
              observations={observations}
              waterLevels={waterLevels}
              continuous={continuous}
              year={year}
              sections={sections}
              qrCodeDataUrl={qrCodeDataUrl}
            />
          </PDFViewer>
        )}
      </Box>
    </Box>
  )
}
