import { IContact, IWell } from '@/interfaces/ocotillo'
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
} from '@mui/material'
import { HttpError, useList, useNavigation, useShow } from '@refinedev/core'
import { ListButton, Show, ShowButton, useDataGrid } from '@refinedev/mui'
import { useParams } from 'react-router-dom'
import { ArrowBack, ExpandMore } from '@mui/icons-material'
import { PDFViewer } from '@react-pdf/renderer'
import {
  ControlledCheckbox,
  ControlledRadioFormSelection,
  WellPDF,
} from '@/components'
import { useEffect, useState } from 'react'
import {
  IPdfDensity,
  IPdfOptions,
  optionalFields,
  PDF_DENSITIES,
} from '@/interfaces'
import { useForm } from '@refinedev/react-hook-form'
import { PDF_DEFAULT_VALUES, PDF_SINGLE_PAGE_OPTION } from '@/config'
import { getLabelFromOptionalPdfFieldKey } from '@/utils'

export const WellShowPdfPreview = () => {
  const { push } = useNavigation()
  const { id } = useParams()
  const [isViewerReady, setIsViewerReady] = useState(false)

  const handleBack = () => push(`/ocotillo/well/show/${id}`)

  const { control, watch, reset } = useForm<IPdfOptions>({
    defaultValues: PDF_DEFAULT_VALUES,
    mode: 'onChange', // update on every change → live preview
    warnWhenUnsavedChanges: false,
  })

  const currentOptions = watch()

  const {
    queryResult: { data: wellData, isLoading: isWellLoading },
  } = useShow<IWell, HttpError>({
    resource: 'thing-well',
    id,
  })

  const {
    dataGridProps: { rows: observations, loading: isObservationsloading },
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

  const isLoading =
    isWellLoading || isAssetLoading || isContactLoading || isObservationsloading

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
                    assets={assets}
                    contacts={contacts}
                    observations={observations}
                    options={currentOptions}
                  />
                </PDFViewer>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Show>
  )
}
