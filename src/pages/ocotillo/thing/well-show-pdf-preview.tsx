import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { Show } from '@refinedev/mui'
import { useParams } from 'react-router'
import {
  ExpandMore,
  TableRows,
  ViewHeadline,
  ViewStream,
} from '@mui/icons-material'
import { PDFViewer } from '@react-pdf/renderer'
import {
  ControlledCheckbox,
  ControlledRadioFormSelection,
  HydrographPngExporter,
  WellPDF,
  WellPDFDownloadButton,
  WellStatusChips,
} from '@/components'
import { useEffect, useMemo, useState } from 'react'
import { IPdfOptions, optionalFields, PDF_DENSITIES } from '@/interfaces'
import { useForm } from '@refinedev/react-hook-form'
import { PDF_DEFAULT_VALUES, PDF_SINGLE_PAGE_OPTION } from '@/config'
import { getLabelFromOptionalPdfFieldKey } from '@/utils'
import { useAccessCapabilities, useWellPdfData } from '@/hooks'
import { IHydrographDatasource } from '@/interfaces/st2'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'

const densityIcons = {
  compact: <ViewHeadline fontSize="small" />,
  standard: <TableRows fontSize="small" />,
  comfortable: <ViewStream fontSize="small" />,
} as const

export const WellShowPdfPreview = () => {
  const { id } = useParams()
  const theme = useTheme()
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [hydrographImage, setHydrographImage] = useState<string | null>(null)
  const { canViewConfidential } = useAccessCapabilities()

  const { control, watch, reset } = useForm<IPdfOptions>({
    defaultValues: PDF_DEFAULT_VALUES,
    mode: 'onChange', // update on every change → live preview
    warnWhenUnsavedChanges: false,
  })

  const currentOptions = watch()
  const {
    well,
    observations,
    assets,
    contacts,
    sample,
    sensorDeployments,
    isLoading,
  } = useWellPdfData({
    thingId: id,
  })

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsViewerReady(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  const densityOptions = PDF_DENSITIES.map((value) => ({
    value,
    label: value
      .split('-')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' '),
    description: null as null,
    icon: densityIcons[value],
  }))

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

  return (
    <Show
      resource="thing-well"
      recordItemId={id}
      isLoading={isLoading}
      goBack={false}
      breadcrumb={
        <AppBreadcrumb
          items={[
            { label: 'Wells', href: '/ocotillo/well' },
            { label: 'Show', href: `/ocotillo/well/show/${id}` },
            { label: 'PDF Preview' },
          ]}
        />
      }
      wrapperProps={{
        elevation: 0,
        sx: {
          bgcolor: 'background.wrapper',
          boxShadow: 'none',
          borderRadius: 1,
          padding: 0,
        },
      }}
      title={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="h3" fontWeight={700}>
            {well?.name ?? ''}
          </Typography>
          <WellStatusChips well={well} />
        </Box>
      }
      headerProps={{
        sx: {
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          '.MuiCardHeader-action': {
            alignSelf: { xs: 'flex-end', md: 'flex-start' },
            mt: { xs: 1, md: 0.5 },
            mr: 0,
          },
        },
      }}
      contentProps={{ sx: { pt: 1 } }}
      headerButtons={() => (
        <Box sx={{ display: 'flex', gap: 0 }}>
          <WellPDFDownloadButton
            well={well}
            isLoading={isLoading}
            observations={observations}
            assets={assets}
            contacts={contacts}
            sample={sample}
            sensorDeployments={sensorDeployments}
            options={currentOptions}
            hydrographImage={hydrographImage}
          />
        </Box>
      )}
    >
      <Box sx={{ mb: 2 }}>
        <Accordion
          defaultExpanded
          disableGutters
          variant="outlined"
          sx={{
            p: 1,
            borderRadius: 2,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 1px 3px rgba(0,0,0,0.35)'
                : '0 1px 3px rgba(0,0,0,0.08)',

            '&::before': {
              display: 'none',
            },

            '&.Mui-expanded': {
              mt: 0,
            },

            '& .MuiAccordionSummary-root': {
              borderRadius: 1.5,
              minHeight: 56,
              px: 1.5,
              transition: 'background-color 0.2s ease',
            },

            '& .MuiAccordionSummary-root:hover': {
              bgcolor: 'action.hover',
            },

            '& .MuiAccordionSummary-root.Mui-expanded': {
              minHeight: 56,
            },

            '& .MuiAccordionSummary-content': {
              my: 1,
            },

            '& .MuiAccordionSummary-expandIconWrapper': {
              color: 'text.secondary',
            },

            '& .MuiAccordionDetails-root': {
              pt: 1,
              px: 2,
              pb: 2,
              color: 'text.primary',
            },

            '& .MuiDivider-root': {
              px: 2,
              pt: 0,
              borderTop: '1px solid',
              borderColor: 'text.secondary',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="density-content"
            id="density-header"
          >
            <Typography variant="subtitle1" fontWeight="medium">
              PDF Export Options
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <ControlledRadioFormSelection
                name="density"
                control={control}
                label="Density:"
                options={densityOptions}
              />
              <Stack direction="column">
                <Typography>Optional Fields:</Typography>
                {optionalFields.map((fieldName) => (
                  <ControlledCheckbox
                    key={fieldName}
                    control={control}
                    name={fieldName}
                    label={getLabelFromOptionalPdfFieldKey(fieldName)}
                    labelPlacement="end"
                  />
                ))}
              </Stack>
            </Box>

            <Divider sx={{ mt: 2, mb: 2.5 }} />

            <Typography variant="caption" color="text.secondary">
              Changes are applied live to the preview below.
            </Typography>
          </AccordionDetails>
          <AccordionActions sx={{ mt: -6.5 }}>
            <Button
              variant="contained"
              onClick={() => {
                reset(PDF_SINGLE_PAGE_OPTION)
              }}
            >
              Single Page Mode
            </Button>
            <Button variant="text" onClick={() => reset(PDF_DEFAULT_VALUES)}>
              Reset
            </Button>
          </AccordionActions>
        </Accordion>
      </Box>
      <Box sx={{ width: '100%', height: '90vh' }}>
        {(!isViewerReady || isLoading) && (
          <Skeleton variant="rectangular" height="100%" />
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
              <WellPDF
                well={well}
                sample={sample}
                assets={assets}
                contacts={contacts}
                observations={observations}
                sensorDeployments={sensorDeployments}
                options={currentOptions}
                hydrographImage={hydrographImage}
                includeConfidentialContacts={canViewConfidential}
              />
            </PDFViewer>
          </Box>
        )}
      </Box>
      {!isLoading && hydrographDatasource.length > 0 && (
        <HydrographPngExporter
          datasource={hydrographDatasource}
          options={{
            ...currentOptions,
            // Extends the x-axis range to create blank space on the right side of the chart.
            // This does NOT change the groundwater measurements; it only shifts the
            // plotted data left so hydrologists have room to annotate the printed hydrograph.
            rightPaddingPercent: 30,
          }}
          refreshKey={`${id}-${JSON.stringify(currentOptions)}`}
          onPngReady={setHydrographImage}
        />
      )}
    </Show>
  )
}
