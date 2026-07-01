import { useMemo, useState } from 'react'
import { Box, Chip, Typography } from '@mui/material'
import type { GridColDef, GridRowParams } from '@mui/x-data-grid'
import { useDataGrid } from '@refinedev/mui'
import type { IAsset } from '@/interfaces/ocotillo'
import { ListPage } from '@/components'
import { AssetActions, AssetPreview } from '@/components/WellShow'
import { formatAppDateTime, formatFileSize, isImage, isPdf } from '@/utils'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button as UiButton } from '@/components/ui/button'

const AssetThumbnail = ({ asset }: { asset: IAsset }) => {
  if (asset.signed_url && isImage(asset)) {
    return (
      <Box
        component="img"
        src={asset.signed_url}
        alt={asset.name}
        sx={{
          width: 72,
          height: 48,
          objectFit: 'cover',
          display: 'block',
          borderRadius: 0.75,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      />
    )
  }

  return (
    <Box
      sx={{
        width: 72,
        height: 48,
        borderRadius: 0.75,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" noWrap>
        {isPdf(asset) ? 'PDF' : asset.mime_type?.split('/')[1] || 'File'}
      </Typography>
    </Box>
  )
}

export const UnassociatedAssetList: React.FC = () => {
  const [previewAsset, setPreviewAsset] = useState<IAsset | null>(null)
  const { dataGridProps, tableQuery } = useDataGrid<IAsset>({
    resource: 'asset/unassociated',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 10, mode: 'server' },
    queryOptions: {
      // Signed URLs expire after 15 minutes. Refresh periodically for preview
      // and download flows that may stay open during cleanup work.
      refetchInterval: 10 * 60 * 1000,
      refetchIntervalInBackground: false,
      staleTime: 9 * 60 * 1000,
    },
  })

  const columns = useMemo<GridColDef<IAsset>[]>(
    () => [
      {
        field: 'preview',
        headerName: 'Preview',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: ({ row }: { row: IAsset }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <AssetThumbnail asset={row} />
          </Box>
        ),
      },
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        minWidth: 220,
        flex: 1,
      },
      {
        field: 'label',
        headerName: 'Label',
        type: 'string',
        minWidth: 220,
        flex: 2,
      },
      {
        field: 'mime_type',
        headerName: 'Type',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'size',
        headerName: 'Size',
        width: 110,
        valueGetter: (size: number) =>
          typeof size === 'number' ? formatFileSize(size) : '',
      },
      {
        field: 'release_status',
        headerName: 'Status',
        width: 130,
        renderCell: ({ value }) =>
          value ? (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Chip label={value} size="small" sx={{ height: 22 }} />
            </Box>
          ) : null,
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        minWidth: 180,
        valueGetter: (isoDate: string) => formatAppDateTime(isoDate),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 110,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <AssetActions
              asset={row}
              refetchAssets={tableQuery.refetch}
              includeDisassociate={false}
              noun="asset"
            />
          </Box>
        ),
      },
    ],
    [tableQuery.refetch]
  )

  const handleRowClick = (params: GridRowParams<IAsset>) => {
    setPreviewAsset(params.row)
  }

  return (
    <>
      <ListPage
        title="Unassociated Assets"
        columns={columns}
        dataGridProps={dataGridProps}
        getRowId={(row) => row.id}
        disableRowClick
        onRowClick={handleRowClick}
        hideHeaderButtons
      />

      <Dialog
        open={Boolean(previewAsset)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAsset(null)
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.name ?? 'Asset preview'}</DialogTitle>
          </DialogHeader>

          {previewAsset && (
            <Box
              sx={{
                maxHeight: '72vh',
                overflow: 'auto',
                bgcolor: 'background.default',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
              }}
            >
              <AssetPreview asset={previewAsset} variant="full" />
            </Box>
          )}

          <DialogFooter>
            <UiButton
              type="button"
              variant="outline"
              onClick={() => setPreviewAsset(null)}
            >
              Cancel
            </UiButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
