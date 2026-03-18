import { useMemo } from 'react'
import { useList } from '@refinedev/core'
import { CreateButton } from '@refinedev/mui'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Image } from '@mui/icons-material'
import { Masonry } from '@mui/lab'
import { settings } from '@/settings'
import { actionColumnDef } from '@/components/CommonColumnDefs'

export const AttachmentsAccordion = ({ id }: { id?: number }) => {
  const { result } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: {
      params: { thing_id: id },
    },
  })

  const assets = result?.data ?? []
  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Name', minWidth: 150 },
      { field: 'uri', headerName: 'URL', flex: 1 },
      actionColumnDef({ resource: 'ocotillo.asset' }) as GridColDef,
    ],
    []
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image color="primary" />
          <Typography variant="body1" fontWeight="bold">
            Attachments
          </Typography>
        </Stack>
        <CreateButton resource="ocotillo.asset" />
      </Box>
      <Box sx={{ p: 3 }}>
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

              <Masonry columns={3} spacing={2}>
                {assets.map((img: any, idx: number) =>
                  img.signed_url ? (
                    <Box
                      key={idx}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 2,
                      }}
                    >
                      <Box
                        component="img"
                        src={img.signed_url}
                        alt={img.name || `Attachment ${idx + 1}`}
                        sx={{
                          width: '100%',
                          display: 'block',
                        }}
                      />
                    </Box>
                  ) : null
                )}
              </Masonry>
            </Box>
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
