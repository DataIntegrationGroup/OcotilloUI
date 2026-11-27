import { Box, LinearProgress, Skeleton } from '@mui/material'
import { Show } from '@refinedev/mui'
import { useDataProvider } from '@refinedev/core'
import { useParams } from 'react-router'
import { PDFViewer } from '@react-pdf/renderer'
import {
  buildGoogleMapsQrDataUrl,
  buildWeaverQrDataUrl,
} from '@/components/pdf/chemistry/wellQrCode'
import {
  FieldCompilationNotesPdf,
  WellPDFDownloadButton,
  WellShowTitle,
} from '@/components'
import { useEffect, useState } from 'react'
import { ReportRail } from './components/ReportRail'
import { fetchSampleMaps, latestSampleIds } from './useSampleMaps'
import {
  hydrographImageOf,
  useHydrographPdf,
  type HydrographPdfResult,
} from '@/components/pdf/fieldCompilation/hydrographPdf'
import { useAccessCapabilities, useWellPdfData } from '@/hooks'
import { IWell } from '@/interfaces/ocotillo'
import {
  ocotilloCardHeaderProps,
  OcotilloHeaderButtons,
} from '@/components/OcotilloPageHeader'

export const WellShowPdfPreview = () => {
  const { id } = useParams()
  const [isViewerReady, setIsViewerReady] = useState(false)
  // Page-2 hydrograph: one awaited build per chart series (null = pending).
  const hydrograph = useHydrographPdf()
  const [hydrographResult, setHydrographResult] =
    useState<HydrographPdfResult | null>(null)
  const hydrographImage = hydrographImageOf(hydrographResult)
  // Owner sheet (page 2) sits behind the Report rail toggle, as in the mockup.
  // A single well's preview is expected to include it, so it starts on.
  const [includeOwnerPage, setIncludeOwnerPage] = useState(true)
  const { canEditAmp, canViewConfidential } = useAccessCapabilities()

  // No on-screen PDF options remain; the hydrograph's chart options live with the
  // builder (hydrographPdf.ts FIELD_SHEET_HYDROGRAPH_OPTIONS, same defaults).
  const {
    well,
    observations,
    assets,
    contacts,
    sensorDeployments,
    chartSeries,
    yearSpan,
    isLoading,
    progress: pdfDataProgress,
  } = useWellPdfData({
    thingId: id,
  })
  const viewWell = well as IWell

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsViewerReady(true), 400)
      return () => clearTimeout(timer)
    }
  }, [isLoading])


  // Chart series and year span: full observation history, via the same
  // compilation adapter the Download and the batch export use.
  useEffect(() => {
    if (isLoading) return
    let cancelled = false
    setHydrographResult(null)
    hydrograph.build(chartSeries).then((result) => {
      if (!cancelled) setHydrographResult(result)
    })
    return () => {
      cancelled = true
    }
  }, [isLoading, chartSeries, hydrograph.build])

  // Page-2 QR: same value the printed URL line uses (buildWeaverLocationUrl(well.name)).
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    setQrDataUrl(undefined)
    buildWeaverQrDataUrl(viewWell?.name).then((url) => {
      if (!cancelled) setQrDataUrl(url ?? undefined)
    })
    return () => {
      cancelled = true
    }
  }, [viewWell?.name])

  // Page-1 QR: Google Maps at the well coordinates (ident block).
  const [mapsQrDataUrl, setMapsQrDataUrl] = useState<string | null>(null)
  const mapsCoords = viewWell?.current_location?.geometry?.coordinates
  const [mapsLon, mapsLat] = Array.isArray(mapsCoords)
    ? (mapsCoords as number[])
    : []
  useEffect(() => {
    let cancelled = false
    setMapsQrDataUrl(null)
    buildGoogleMapsQrDataUrl(mapsLat, mapsLon).then((url) => {
      if (!cancelled) setMapsQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [mapsLat, mapsLon])

  // Last Measurements · Method / Staff: same sample lookup the batch export
  // uses (useSampleMaps.fetchSampleMaps), keyed on the two newest sample ids.
  const dataProvider = useDataProvider()
  const [sampleMaps, setSampleMaps] = useState<{
    sampleMethodsBySampleId: Record<number, string>
    staffBySampleId: Record<number, string>
  }>({ sampleMethodsBySampleId: {}, staffBySampleId: {} })
  const sampleIdsKey = latestSampleIds(observations ?? []).join(',')
  useEffect(() => {
    let cancelled = false
    if (!sampleIdsKey) {
      setSampleMaps({ sampleMethodsBySampleId: {}, staffBySampleId: {} })
      return
    }
    fetchSampleMaps(dataProvider('ocotillo'), observations ?? []).then((maps) => {
      if (!cancelled) setSampleMaps(maps)
    })
    return () => {
      cancelled = true
    }
    // Refetch only when the newest readings' samples change.
  }, [sampleIdsKey])

  const progress = isLoading
    ? Math.min(pdfDataProgress, 75)
    : !isViewerReady
      ? 90
      : hydrographResult === null
        ? 95
        : 100

  return (
    <Show
      resource="thing-well"
      recordItemId={id}
      goBack={false}
      breadcrumb={false}
      wrapperProps={{
        elevation: 0,
        sx: {
          bgcolor: 'background.wrapper',
          boxShadow: 'none',
          borderRadius: 1,
          padding: 0,
        },
      }}
      title={<WellShowTitle well={viewWell} isLoading={isLoading} />}
      headerProps={ocotilloCardHeaderProps}
      contentProps={{ sx: { pt: 1 } }}
      headerButtons={() =>
        canEditAmp ? (
          <OcotilloHeaderButtons className="flex items-center gap-0">
            <WellPDFDownloadButton
              well={viewWell}
              isLoading={isLoading}
              observations={observations}
              assets={assets}
              contacts={contacts}
              sensorDeployments={sensorDeployments}
              hydrographImage={hydrographImage}
              includeOwnerPage={includeOwnerPage}
              sampleMethodsBySampleId={sampleMaps.sampleMethodsBySampleId}
              staffBySampleId={sampleMaps.staffBySampleId}
            />
          </OcotilloHeaderButtons>
        ) : null
      }
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          width: '100%',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, height: '90vh', position: 'relative' }}>
          {(isLoading ||
            !isViewerReady ||
            hydrographResult === null) && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                bgcolor: 'background.paper',
              }}
            >
              <LinearProgress variant="determinate" value={progress} />
              <Skeleton variant="rectangular" height="100%" />
            </Box>
          )}
          {!isLoading && (
            <Box
              sx={{
                opacity: isViewerReady ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
                width: '100%',
                height: '100%',
              }}
            >
              <PDFViewer width="100%" height="100%">
                <FieldCompilationNotesPdf
                  well={viewWell}
                  assets={assets}
                  contacts={contacts}
                  observations={observations}
                  sensorDeployments={sensorDeployments}
                  hydrographImage={hydrographImage}
                  includeConfidentialContacts={canViewConfidential}
                  includeOwnerPage={includeOwnerPage}
                  sampleMethodsBySampleId={sampleMaps.sampleMethodsBySampleId}
                  staffBySampleId={sampleMaps.staffBySampleId}
                  qrDataUrl={qrDataUrl}
                  mapsQrDataUrl={mapsQrDataUrl}
                  yearSpan={yearSpan}
                />
              </PDFViewer>
            </Box>
          )}
        </Box>
        <ReportRail
          includeOwnerPage={includeOwnerPage}
          onToggleOwnerPage={setIncludeOwnerPage}
        />
      </Box>
      {hydrograph.element}
    </Show>
  )
}
