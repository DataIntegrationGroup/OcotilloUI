import { IContact, IWell } from '@/interfaces/ocotillo/IThing'
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material'
import { HttpError, useList, useNavigation, useShow } from '@refinedev/core'
import { ListButton, Show, ShowButton } from '@refinedev/mui'
import { useParams } from 'react-router-dom'
import { ArrowBack } from '@mui/icons-material'
import { PDFViewer } from '@react-pdf/renderer'
import { WellPDF } from '@/components'
import { useEffect, useState } from 'react'

export const WellShowPdfPreview = () => {
  const { push } = useNavigation()
  const { id } = useParams()
  const [isViewerReady, setIsViewerReady] = useState(false)

  const handleBack = () => push(`/ocotillo/well/show/${id}`)

  const {
    queryResult: { data: wellData, isLoading: isWellLoading },
  } = useShow<IWell, HttpError>({
    resource: 'thing-well',
    id,
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

  console.log({ contacts })

  const isLoading = isWellLoading || isAssetLoading || isContactLoading

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setIsViewerReady(true), 250)
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
                  <WellPDF well={well} assets={assets} contacts={contacts} />
                </PDFViewer>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Show>
  )
}
