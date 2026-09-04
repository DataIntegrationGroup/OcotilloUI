import {
  Alert,
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { PDFViewer } from '@react-pdf/renderer'
import { useOne } from '@refinedev/core'
import { useAutocomplete } from '@refinedev/mui'
import { useEffect, useMemo, useState } from 'react'
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
import { useChemistryReportData, useDebounce } from '@/hooks'
import type { IWell } from '@/interfaces/ocotillo'

/**
 * Reporting periods offered in the picker: this year and the four before it,
 * plus whatever year was linked to. A well last sampled outside that window
 * still has to be selectable, or arriving from its details page would land on
 * a year the picker cannot show.
 */
const buildYearOptions = (linkedYear?: number): number[] => {
  const current = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, index) => current - index)
  if (linkedYear && !years.includes(linkedYear)) years.push(linkedYear)
  return years.sort((a, b) => b - a)
}

const parseYearParam = (value: string | null): number | undefined => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 1900 ? parsed : undefined
}

export const ChemistryReportExport = () => {
  // The well details page links here with the report it wants already chosen.
  const [searchParams] = useSearchParams()
  const linkedThingId = searchParams.get('thing_id')
  const linkedYear = parseYearParam(searchParams.get('year'))

  const yearOptions = useMemo(() => buildYearOptions(linkedYear), [linkedYear])
  const [selectedWell, setSelectedWell] = useState<IWell | null>(null)
  const [year, setYear] = useState<number>(linkedYear ?? yearOptions[0])

  const { result: linkedWell } = useOne<IWell>({
    resource: 'thing-well',
    id: linkedThingId ?? undefined,
    queryOptions: { enabled: Boolean(linkedThingId) },
  })

  useEffect(() => {
    // Only seeds the picker — once the user changes it, this stops applying.
    if (linkedWell && !selectedWell) setSelectedWell(linkedWell as IWell)
  }, [linkedWell, selectedWell])
  const [sections, setSections] = useState<ChemistryReportSections>(
    CHEMISTRY_REPORT_DEFAULT_SECTIONS
  )

  const [wellSearch, setWellSearch] = useState('')
  const debouncedWellSearch = useDebounce(wellSearch, 300)

  // The API filters wells by the `name_contains` query param rather than by a
  // Refine filter, so the search term is threaded through meta.params — the
  // same shape the Wells list uses.
  const { autocompleteProps } = useAutocomplete<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        include_contacts: true,
        ...(debouncedWellSearch ? { name_contains: debouncedWellSearch } : {}),
      },
    },
  })

  const { well, contacts, observations, waterLevels, isLoading, isError } =
    useChemistryReportData({ thingId: selectedWell?.id, year })

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

  const isReady = Boolean(selectedWell) && !isLoading && !isError

  return (
    <Box>
      <OcotilloPageTitle title="Chemistry Report Exporter">
        <ChemistryReportDownloadButton
          well={well}
          contacts={contacts}
          observations={observations}
          waterLevels={waterLevels}
          year={year}
          sections={sections}
          disabled={!isReady}
        />
      </OcotilloPageTitle>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Generate an owner-facing annual water quality report for a single well.
        Multi-well runs, delivery, and scheduling are not implemented yet.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Autocomplete
              {...autocompleteProps}
              value={selectedWell}
              onChange={(_, newValue) => setSelectedWell(newValue)}
              getOptionKey={(option) => option.id}
              getOptionLabel={(option) => `${option.name} (${option.id})`}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              inputValue={wellSearch}
              onInputChange={(_, newInput) => setWellSearch(newInput)}
              filterOptions={(options) => options}
              renderInput={(params) => (
                <TextField {...params} label="Well" size="small" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Reporting year"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {yearOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {`Calendar year ${option}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack>
              <Typography variant="caption" color="text.secondary">
                Sections
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {(
                  Object.keys(
                    CHEMISTRY_REPORT_SECTION_LABELS
                  ) as (keyof ChemistryReportSections)[]
                ).map((key) => (
                  <FormControlLabel
                    key={key}
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
                ))}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load chemistry data for this well.
        </Alert>
      ) : null}

      {selectedWell && !isLoading && observations.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {`No water chemistry is on file for ${selectedWell.name} in ${year}. The report still generates, marked as having no results.`}
        </Alert>
      ) : null}

      <Box sx={{ width: '100%', height: '80vh' }}>
        {!selectedWell ? (
          <Paper
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">
              Select a well to preview its report.
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
