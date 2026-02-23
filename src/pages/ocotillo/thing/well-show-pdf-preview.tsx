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
import { IPdfOptions } from '@/interfaces'
import { useForm } from '@refinedev/react-hook-form'

export const WellShowPdfPreview = () => {
  const { push } = useNavigation()
  const { id } = useParams()
  const [isViewerReady, setIsViewerReady] = useState(false)

  const handleBack = () => push(`/ocotillo/well/show/${id}`)

  const { control, watch, reset } = useForm<IPdfOptions>({
    defaultValues: {
      includeNotes: true,
      includeAssets: true,
      includeContacts: true,
      includeObservations: true,
      includeBlankPage: false,
      density: 'normal',
    },
    mode: 'onChange', // update on every change → live preview
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
                    options={[
                      { value: 'normal', label: 'Normal', description: null },
                      { value: 'dense', label: 'Dense', description: null },
                      {
                        value: 'very-dense',
                        label: 'Very Dense',
                        description: null,
                      },
                    ]}
                  />
                  <Stack direction="column">
                    <Typography>Sections to include:</Typography>
                    <ControlledCheckbox
                      control={control}
                      name="includeNotes"
                      label="Notes"
                      labelPlacement="end"
                    />
                    <ControlledCheckbox
                      control={control}
                      name="includeContacts"
                      label="Contacts"
                      labelPlacement="end"
                    />
                    <ControlledCheckbox
                      control={control}
                      name="includeAssets"
                      label="Assets/Images"
                      labelPlacement="end"
                    />
                    <ControlledCheckbox
                      control={control}
                      name="includeObservations"
                      label="Observations"
                      labelPlacement="end"
                    />
                    <ControlledCheckbox
                      control={control}
                      name="includeBlankPage"
                      label="Blank Page"
                      labelPlacement="end"
                    />
                  </Stack>
                </Box>

                <Divider sx={{ mt: 2, mb: 2.5 }} />

                <Typography variant="caption" color="text.secondary">
                  Changes are applied live to the preview below.
                </Typography>
              </AccordionDetails>
              <AccordionActions sx={{ mt: -6.5 }}>
                <Button variant="text" onClick={() => reset()}>
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
