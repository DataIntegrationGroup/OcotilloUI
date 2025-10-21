import { useEffect, useMemo, useState } from 'react'
import { useList } from '@refinedev/core'
import { CreateButton } from '@refinedev/mui'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  ImageList,
  ImageListItem,
  Stack,
  Typography,
  Box,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { ExpandMore, Image } from '@mui/icons-material'
import { settings } from '@/settings'
import { actionColumnDef } from '@/components/CommonColumnDefs'

export const AttachmentsAccordion = ({ id }: { id?: number }) => {
  const [assets, setAssets] = useState([])

  const { data } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        thing_id: id,
      },
    },
  })

  useEffect(() => {
    if (!data || !data.data || data.total === 0) return
    setAssets(data.data)
  }, [data])

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Name', minWidth: 150 },
      { field: 'uri', headerName: 'URL', flex: 1 },
      actionColumnDef({ resource: 'ocotillo.asset' }) as GridColDef,
    ],
    []
  )

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Image color="primary" />
            <Typography variant="body1" fontWeight="bold">
              Attachments
            </Typography>
          </Stack>
          <CreateButton resource="ocotillo.asset" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        {(!assets || assets.length === 0) && (
          <Box textAlign="center" py={4}>
            <Image sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No attachments available.
            </Typography>
          </Box>
        )}
        {assets && assets.length > 0 && (
          <Stack spacing={3}>
            <DataGrid
              rowHeight={settings.rowHeight}
              columns={columns}
              rows={assets}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
            />
            <Box>
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                Image Gallery
              </Typography>
              <ImageList
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  overflowX: 'auto',
                  gap: 2,
                }}
                cols={3}
              >
                {(assets ?? []).map(
                  (img: { signed_url: string; name?: string }, idx: number) => (
                    <ImageListItem
                      key={idx}
                      sx={{
                        minWidth: 200,
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 2,
                      }}
                    >
                      <img
                        src={img.signed_url}
                        alt={img.name || `Attachment ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: 8,
                        }}
                      />
                    </ImageListItem>
                  )
                )}
              </ImageList>
            </Box>
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
