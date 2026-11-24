import { Box, LinearProgress, Skeleton, useTheme } from '@mui/material'
import { Show } from '@refinedev/mui'
import { useParams } from 'react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { buildWeaverQrDataUrl } from '@/components/pdf/chemistry/wellQrCode'
import {
  FieldCompilationNotesPdf,
  HydrographPngExporter,
  WellPDFDownloadButton,
  WellShowTitle,
} from '@/components'
import { useEffect, useMemo, useState } from 'react'
import { PDF_DEFAULT_VALUES } from '@/config'
import { useAccessCapabilities, useWellPdfData } from '@/hooks'
import { IWell } from '@/interfaces/ocotillo'
import { IPdfOptions } from '@/interfaces'
import type { IHydrographDatasource, IHydrographOptions } from '@/interfaces/st2'
import {
  ocotilloCardHeaderProps,
  OcotilloHeaderButtons,
} from '@/components/OcotilloPageHeader'

export const WellShowPdfPreview = () => {
  const { id } = useParams()
  const theme = useTheme()
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [hydrographImage, setHydrographImage] = useState<string | null>(null)
  const { canEditAmp, canViewConfidential } = useAccessCapabilities()

  // No on-screen PDF options remain: the field-compilation template takes document
  // props, not IPdfOptions. The hydrograph still reads the same chart defaults; the
  // chart keys were only ever set by the removed export-options panel, so they stay unset.
  const currentOptions: IPdfOptions & Partial<IHydrographOptions> = PDF_DEFAULT_VALUES
  const {
    well,
    observations,
    assets,
    contacts,
    sensorDeployments,
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


  const hydrographDatasource = useMemo<IHydrographDatasource[]>(() => {
    if (!observations?.length) return []

    const data = observations
      .filter((o) => o.observation_datetime && typeof o.value === 'number')
      .map((o) => ({
        phenomenonTime: o.observation_datetime,
        result: Number(o.depth_to_water_bgs),
      }))
      .sort(
        (a, b) =>
          new Date(a.phenomenonTime).getTime() -
          new Date(b.phenomenonTime).getTime()
      )

    if (!data.length) return []

    return [
      {
        id: Number(well?.id ?? 0),
        name: well?.name ?? 'Depth to Water',
        style: 'scatter',
        data,
      },
    ]
  }, [observations, well])

  const hydrographOption = useMemo(() => {
    if (!observations?.length) return null

    const pts = observations
      .filter((o) => o.observation_datetime && typeof o.value === 'number')
      .map((o) => [
        new Date(o.observation_datetime!).getTime(),
        Number(o.value),
      ])
      .sort((a, b) => a[0] - b[0])

    const yaxisTitle = currentOptions?.useNormalization
      ? 'Normalized Depth To Water Below Ground Surface (ft)'
      : currentOptions?.useElevation
        ? 'Groundwater Elevation Above Sea Level (ft)'
        : currentOptions?.useCompact
          ? 'Compact Depth To Water Below Ground Surface (ft)'
          : 'Depth To Water Below Ground Surface (ft)'

    return {
      animation: false,
      backgroundColor: theme.palette.background.paper,

      toolbox: currentOptions?.showToolbox
        ? {
            feature: {
              dataZoom: [{ show: true }, { type: 'inside' }],
              restore: {},
              saveAsImage: {},
              dataView: { show: true },
              brush: { type: ['lineX', 'clear'] },
            },
          }
        : undefined,

      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', animation: false },
        backgroundColor: theme.palette.background.paper,
        textStyle: { color: theme.palette.text.primary },
      },

      dataZoom: [{ type: 'inside' }],

      xAxis: {
        type: 'time',
        splitLine: { show: true },
        axisLabel: { color: theme.palette.text.secondary },
      },

      yAxis: {
        type: 'value',
        inverse: currentOptions?.invertYAxis ?? true,
        name: yaxisTitle,
        nameLocation: 'center',
        nameGap: 50,
        scale: true,
        axisLabel: { color: theme.palette.text.secondary },
        splitLine: { show: true },
      },

      brush: { outOfBrush: { colorAlpha: 0.25 } },

      // match your theme-ish palette; for single series you can keep just one
      color: ['#0277BD'],

      series: [
        {
          type: 'scatter',
          name: 'Depth to Water',
          data: pts,
          symbol: 'circle',
          symbolSize: 8,
          clip: false,
        },
      ],
    }
  }, [
    observations,
    currentOptions?.invertYAxis,
    currentOptions?.useNormalization,
    currentOptions?.useElevation,
    currentOptions?.useCompact,
    currentOptions?.dataZoom,
    currentOptions?.showToolbox,
    theme,
  ])

  useEffect(() => {
    // reset image when inputs change so you don't keep old chart
    setHydrographImage(null)
  }, [id, hydrographOption])

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

  const progress = isLoading
    ? Math.min(pdfDataProgress, 75)
    : !isViewerReady
      ? 90
      : hydrographDatasource.length > 0 && !hydrographImage
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
            />
          </OcotilloHeaderButtons>
        ) : null
      }
    >
      <Box sx={{ width: '100%', height: '90vh', position: 'relative' }}>
        {(isLoading ||
          !isViewerReady ||
          (hydrographDatasource.length > 0 && !hydrographImage)) && (
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
                qrDataUrl={qrDataUrl}
              />
            </PDFViewer>
          </Box>
        )}
      </Box>
      {!isLoading && hydrographDatasource.length > 0 && (
        <HydrographPngExporter
          datasource={hydrographDatasource}
          options={{
            useNormalization: currentOptions.useNormalization,
            useElevation: currentOptions.useElevation,
            useCompact: currentOptions.useCompact,
            dataZoom: currentOptions.dataZoom,
            showToolbox: currentOptions.showToolbox,
            invertYAxis: currentOptions.invertYAxis,
            // Extends the x-axis range to create blank space on the right side of the chart.
            // This does NOT change the groundwater measurements; it only shifts the
            // plotted data left so hydrologists have room to annotate the printed hydrograph.
            rightPaddingPercent: 30,
          }}
          refreshKey={`${id}`}
          onPngReady={setHydrographImage}
        />
      )}
    </Show>
  )
}
