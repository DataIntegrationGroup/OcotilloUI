import { useMemo, useState } from 'react'
import {
  Box,
  ButtonBase,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
  Tooltip,
  Button,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  ChevronLeft,
  ChevronRight,
  GridView,
  Image,
  ViewCarousel,
} from '@mui/icons-material'
import { Masonry } from '@mui/lab'
import { settings } from '@/settings'
import type { IAsset } from '@/interfaces/ocotillo'

type ImageViewMode = 'grid' | 'slideshow'

const isImage = (asset: IAsset) => asset.mime_type?.startsWith('image/')

const isPdf = (asset: IAsset) => asset.mime_type === 'application/pdf'

const isText = (asset: IAsset) => asset.mime_type === 'text/plain'

const canPreview = (asset: IAsset) =>
  Boolean(asset.signed_url) && (isImage(asset) || isPdf(asset) || isText(asset))

export const AttachmentsCard = ({
  assets,
  isLoading,
}: {
  assets: IAsset[]
  isLoading: boolean
}) => {
  const [imageViewMode, setImageViewMode] = useState<ImageViewMode>('grid')
  const [slideshowIndex, setSlideshowIndex] = useState(0)

  const previewAssets = useMemo(() => assets.filter(canPreview), [assets])

  const columns = useMemo<GridColDef<IAsset>[]>(
    () => [
      { field: 'name', headerName: 'Name', minWidth: 150 },
      {
        field: 'uri',
        headerName: 'URL',
        flex: 1,
        minWidth: 200,
        renderCell: ({ value }) => {
          const href = typeof value === 'string' ? value : ''
          if (!href) {
            return (
              <Typography variant="body2" color="text.secondary">
                N/A
              </Typography>
            )
          }
          return (
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                maxWidth: '100%',
              }}
            >
              {href}
            </Link>
          )
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 180,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            {row.signed_url && (
              <Button
                size="small"
                component="a"
                href={row.signed_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </Button>
            )}

            {row.signed_url && (
              <Button
                size="small"
                component="a"
                href={row.signed_url}
                download={row.name}
              >
                Download
              </Button>
            )}
          </Stack>
        ),
      },
    ],
    []
  )

  const currentAsset = previewAssets[slideshowIndex]
  const hasAssets = previewAssets.length > 0

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Image color="primary" />
        <Typography variant="body1" fontWeight="bold">
          Attachments
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              Loading attachments...
            </Typography>
          </Box>
        ) : assets.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Image sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No attachments available.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Images section (above table) with view toggle */}
            {hasAssets && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  spacing={0.5}
                  sx={{ mb: 2 }}
                >
                  <Tooltip title="Grid view">
                    <IconButton
                      size="small"
                      color={imageViewMode === 'grid' ? 'primary' : 'default'}
                      onClick={() => setImageViewMode('grid')}
                      aria-pressed={imageViewMode === 'grid'}
                    >
                      <GridView />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Slideshow view">
                    <IconButton
                      size="small"
                      color={
                        imageViewMode === 'slideshow' ? 'primary' : 'default'
                      }
                      onClick={() => {
                        setImageViewMode('slideshow')
                        setSlideshowIndex(0)
                      }}
                      aria-pressed={imageViewMode === 'slideshow'}
                    >
                      <ViewCarousel />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {imageViewMode === 'grid' ? (
                  <Masonry columns={3} spacing={2}>
                    {previewAssets.map((img, idx) => (
                      <ButtonBase
                        key={img.id ?? idx}
                        focusRipple
                        aria-label={`Open ${img.name || `attachment ${idx + 1}`} in slideshow`}
                        onClick={() => {
                          setSlideshowIndex(idx)
                          setImageViewMode('slideshow')
                        }}
                        sx={{
                          display: 'block',
                          width: '100%',
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: 2,
                          textAlign: 'left',
                        }}
                      >
                        <AssetPreview asset={currentAsset} />
                        <Box
                          component="img"
                          src={img.signed_url}
                          alt={img.name || `Attachment ${idx + 1}`}
                          sx={{
                            width: '100%',
                            display: 'block',
                            verticalAlign: 'bottom',
                          }}
                        />
                      </ButtonBase>
                    ))}
                  </Masonry>
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: 2,
                      bgcolor: 'grey.100',
                      minHeight: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AssetPreview asset={currentAsset} />
                    <Box
                      component="img"
                      src={currentAsset?.signed_url}
                      alt={currentAsset?.name || `Image ${slideshowIndex + 1}`}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 400,
                        objectFit: 'contain',
                      }}
                    />
                    {previewAssets.length > 1 && (
                      <>
                        <IconButton
                          aria-label="Previous image"
                          onClick={() =>
                            setSlideshowIndex((i) =>
                              i === 0 ? previewAssets.length - 1 : i - 1
                            )
                          }
                          sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.8)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                          }}
                        >
                          <ChevronLeft />
                        </IconButton>
                        <IconButton
                          aria-label="Next image"
                          onClick={() =>
                            setSlideshowIndex((i) =>
                              i === previewAssets.length - 1 ? 0 : i + 1
                            )
                          }
                          sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.8)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                          }}
                        >
                          <ChevronRight />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                          }}
                        >
                          {slideshowIndex + 1} / {previewAssets.length}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}

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
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

const AssetPreview = ({ asset }: { asset: IAsset }) => {
  if (isImage(asset)) {
    return (
      <Box
        component="img"
        src={asset.signed_url}
        alt={asset.name}
        sx={{
          width: '100%',
          maxHeight: 400,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    )
  }

  if (isPdf(asset)) {
    return (
      <Box
        component="iframe"
        src={asset.signed_url}
        title={asset.name}
        sx={{
          width: '100%',
          height: 500,
          border: 0,
        }}
      />
    )
  }

  if (isText(asset)) {
    return (
      <Box
        component="iframe"
        src={asset.signed_url}
        title={asset.name}
        sx={{
          width: '100%',
          height: 300,
          border: 0,
          bgcolor: 'background.paper',
        }}
      />
    )
  }

  return <Typography color="text.secondary">Preview not available.</Typography>
}
