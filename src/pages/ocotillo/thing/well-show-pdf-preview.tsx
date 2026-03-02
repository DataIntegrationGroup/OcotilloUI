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
import {
  HttpError,
  useList,
  useNavigation,
  useOne,
  useShow,
} from '@refinedev/core'
import { ListButton, Show, ShowButton, useDataGrid } from '@refinedev/mui'
import { useParams } from 'react-router-dom'
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

export const WellShowPdfPreview = () => {
  const { push } = useNavigation()
  const { id } = useParams()
  const theme = useTheme()
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [hydrographImage, setHydrographImage] = useState<string | null>(null)

  const handleBack = () => push(`/ocotillo/well/show/${id}`)

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
      cacheTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { dataGridProps: deploymentsDataGridProps } = useDataGrid({
    resource: id ? `thing/${id}/deployment` : undefined,
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: Boolean(id),
      cacheTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const sensors = sensorDataGridProps?.rows ?? []
  const deployments = deploymentsDataGridProps?.rows ?? []

  const sensorDeployments: SensorDeploymentRow[] = useSensorDeploymentRows({
    deployments,
    sensors,
  })

  const {
    queryResult: { data: wellData, isLoading: isWellLoading },
  } = useShow<IWell, HttpError>({
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
      cacheTime: 10 * 60 * 1000, // cached data for 10 minutes
      staleTime: 5 * 60 * 1000, // get data fresh for 5 minutes,
    },
  })

  const { data: assetData, isLoading: isAssetLoading } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: id } },
  })

  const { data: contactData, isLoading: isContactLoading } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: id } },
  })

  const well = wellData?.data
  const assets = assetData?.data ?? []
  const contacts = contactData?.data ?? []

  const sampleId =
    observations
      ?.filter((o) => o.observation_datetime) // only ones with date
      .sort((a, b) => {
        // Newest first
        return (
          new Date(b.observation_datetime!).getTime() -
          new Date(a.observation_datetime!).getTime()
        )
      })[0]?.sample_id ?? null

  const { data: sampleData, isLoading: isSampleLoading } = useOne<ISample>({
    resource: 'ocotillo.sample',
    id: sampleId,
    queryOptions: {
      enabled: !!sampleId,
    },
  })

  const sample = sampleData?.data

  const isLoading =
    isWellLoading ||
    isAssetLoading ||
    isContactLoading ||
    isObservationsLoading ||
    isSampleLoading

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
        inverse: true,
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
                bgcolor: 'grey.50',
                borderRadius: 2,
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
          {!isLoading && hydrographOption && (
            <HydrographPngExporter
              option={hydrographOption}
              onPngReady={(png) => setHydrographImage(png)}
            />
          )}
        </CardContent>
      </Card>
    </Show>
  )
}
