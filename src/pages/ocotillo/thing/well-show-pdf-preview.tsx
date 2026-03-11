import { IContact, ISample, ISensor, IWell } from '@/interfaces/ocotillo'
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { HttpError, useList, useGo, useOne, useShow } from '@refinedev/core'
import { ListButton, Show, ShowButton, useDataGrid } from '@refinedev/mui'
import { useParams } from 'react-router'
import { ArrowBack, ExpandMore } from '@mui/icons-material'
import { PDFViewer } from '@react-pdf/renderer'
import {
  ControlledCheckbox,
  ControlledRadioFormSelection,
  HydrographPngExporter,
  WellPDF,
} from '@/components'
import { useEffect, useMemo, useState } from 'react'
import { IPdfOptions, optionalFields, PDF_DENSITIES } from '@/interfaces'
import { useForm } from '@refinedev/react-hook-form'
import { PDF_DEFAULT_VALUES, PDF_SINGLE_PAGE_OPTION } from '@/config'
import { getLabelFromOptionalPdfFieldKey } from '@/utils'
import { useSensorDeploymentRows } from '@/hooks'
import { SensorDeploymentRow } from '@/utils'
import { IHydrographDatasource } from '@/interfaces/st2'

export const WellShowPdfPreview = () => {
  const go = useGo()
  const { id } = useParams()
  const theme = useTheme()
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [hydrographImage, setHydrographImage] = useState<string | null>(null)

  const handleBack = () => go({ to: `/ocotillo/well/show/${id}`, type: 'push' })

  const { control, watch, reset } = useForm<IPdfOptions>({
    defaultValues: PDF_DEFAULT_VALUES,
    mode: 'onChange', // update on every change → live preview
    warnWhenUnsavedChanges: false,
  })

  const currentOptions = watch()

  const { dataGridProps: sensorDataGridProps } = useDataGrid<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { dataGridProps: deploymentsDataGridProps } = useDataGrid({
    resource: id ? `thing/${id}/deployment` : undefined,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: Boolean(id),
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const sensors = sensorDataGridProps?.rows ?? []
  const deployments = deploymentsDataGridProps?.rows ?? []

  const sensorDeployments: SensorDeploymentRow[] = useSensorDeploymentRows({
    deployments,
    sensors,
  })

  const { result: well, query: wellQuery } = useShow<IWell, HttpError>({
    resource: 'thing-well',
    id,
  })

  const {
    dataGridProps: { rows: observations, loading: isObservationsLoading },
  } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
    queryOptions: {
      gcTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { result: assetData, query: assetQuery } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: id } },
  })

  const { result: contactData, query: contactQuery } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: id } },
  })

  const assets = assetData?.data ?? []
  const contacts = contactData?.data ?? []

  const sampleId = useMemo(() => {
    return (
      observations
        ?.filter((o) => o.observation_datetime)
        .sort(
          (a, b) =>
            new Date(b.observation_datetime!).getTime() -
            new Date(a.observation_datetime!).getTime()
        )[0]?.sample_id ?? null
    )
  }, [observations])

  const hasSampleId = sampleId != null

  const { result: sampleData, query: sampleQuery } = useOne<ISample>({
    resource: 'ocotillo.sample',
    id: sampleId,
    queryOptions: {
      enabled: hasSampleId,
    },
  })

  const sample = sampleData

  const isLoading =
    wellQuery.isLoading ||
    assetQuery.isLoading ||
    contactQuery.isLoading ||
    isObservationsLoading ||
    (hasSampleId && sampleQuery.isLoading)

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
      goBack={
        <IconButton aria-label="return to show page" onClick={handleBack}>
          <ArrowBack />
        </IconButton>
      }
      title={
        <Typography variant="h5">
          {`PDF Preview Well${well?.name ? `: ${well?.name}` : ''}`}
        </Typography>
      }
      headerButtons={({ defaultButtons }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ShowButton resource="ocotillo.thing-well" recordItemId={id} />
          <ListButton resource="ocotillo.thing-well" />
          {defaultButtons}
        </Box>
      )}
    >
      <Card elevation={2}>
        <CardContent>
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
                <Button
                  variant="text"
                  onClick={() => reset(PDF_DEFAULT_VALUES)}
                >
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
        </CardContent>
      </Card>
    </Show>
  )
}
