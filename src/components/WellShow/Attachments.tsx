import { useMemo, useState } from 'react'
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tooltip,
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

export const AttachmentsAccordion = ({
  assets,
  isLoading,
}: {
  assets: IAsset[]
  isLoading: boolean
}) => {
  const [imageViewMode, setImageViewMode] = useState<ImageViewMode>('grid')
  const [slideshowIndex, setSlideshowIndex] = useState(0)

  const imageAssets = useMemo(
    () => assets.filter((a: { signed_url?: string }) => a?.signed_url),
    [assets]
  )

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Name', minWidth: 150 },
      { field: 'uri', headerName: 'URL', flex: 1 },
    ],
    []
  )

  const currentImage = imageAssets[slideshowIndex]
  const hasImages = imageAssets.length > 0

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
            {hasImages && (
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
                    {imageAssets.map(
                      (
                        img: { signed_url: string; name?: string },
                        idx: number
                      ) => (
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
                            width={381}
                            height={286}
                            sx={{
                              width: '100%',
                              height: 'auto',
                              display: 'block',
                              aspectRatio: '381 / 286',
                            }}
                          />
                        </Box>
                      )
                    )}
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
                    <Box
                      component="img"
                      src={currentImage?.signed_url}
                      alt={currentImage?.name || `Image ${slideshowIndex + 1}`}
                      width={381}
                      height={286}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 400,
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                    />
                    {imageAssets.length > 1 && (
                      <>
                        <IconButton
                          aria-label="Previous image"
                          onClick={() =>
                            setSlideshowIndex((i) =>
                              i === 0 ? imageAssets.length - 1 : i - 1
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
                              i === imageAssets.length - 1 ? 0 : i + 1
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
                          {slideshowIndex + 1} / {imageAssets.length}
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
