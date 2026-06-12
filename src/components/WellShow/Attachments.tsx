import { useMemo, useState } from 'react'
import {
  Box,
  ButtonBase,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tooltip,
  Button,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  GridView,
  Image,
  ViewCarousel,
} from '@mui/icons-material'
import { Masonry } from '@mui/lab'
import type { IAsset } from '@/interfaces/ocotillo'

type PreviewViewMode = 'grid' | 'slideshow'

const isImage = (asset: IAsset) => asset.mime_type?.startsWith('image/')

const isPdf = (asset: IAsset) => asset.mime_type === 'application/pdf'

const isText = (asset: IAsset) => asset.mime_type === 'text/plain'

const canPreview = (asset: IAsset) =>
  Boolean(asset.signed_url) && (isImage(asset) || isPdf(asset) || isText(asset))

export const AttachmentsCard = ({
  assets,
  isLoading,
  refetchAssets,
}: {
  assets: IAsset[]
  isLoading: boolean
  refetchAssets: () => Promise<unknown>
}) => {
  const [previewViewMode, setPreviewViewMode] =
    useState<PreviewViewMode>('grid')
  const [slideshowIndex, setSlideshowIndex] = useState(0)

  const previewAssets = useMemo(() => assets.filter(canPreview), [assets])

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
                      color={previewViewMode === 'grid' ? 'primary' : 'default'}
                      onClick={() => setPreviewViewMode('grid')}
                      aria-pressed={previewViewMode === 'grid'}
                    >
                      <GridView />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Slideshow view">
                    <IconButton
                      size="small"
                      color={
                        previewViewMode === 'slideshow' ? 'primary' : 'default'
                      }
                      onClick={() => {
                        setPreviewViewMode('slideshow')
                        setSlideshowIndex(0)
                      }}
                      aria-pressed={previewViewMode === 'slideshow'}
                    >
                      <ViewCarousel />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {previewViewMode === 'grid' ? (
                  <Masonry columns={3} spacing={2}>
                    {previewAssets.map((asset, idx) => (
                      <ButtonBase
                        key={asset.id ?? idx}
                        focusRipple
                        aria-label={`Open ${asset.name || `attachment ${idx + 1}`} in slideshow`}
                        onClick={() => {
                          setSlideshowIndex(idx)
                          setPreviewViewMode('slideshow')
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
                        <AssetPreviewWithOverlay
                          asset={asset}
                          variant="grid"
                          refetchAssets={refetchAssets}
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
                    {currentAsset && (
                      <AssetPreviewWithOverlay
                        asset={currentAsset}
                        variant="slideshow"
                        refetchAssets={refetchAssets}
                      />
                    )}
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
          </Stack>
        )}
      </Box>
    </Paper>
  )
}

const previewStyles = {
  grid: {
    image: {
      width: '100%',
      display: 'block',
      verticalAlign: 'bottom',
    },
    frame: {
      width: '100%',
      height: 220,
      border: 0,
      bgcolor: 'background.paper',
    },
  },
  slideshow: {
    image: {
      width: '100%',
      maxWidth: '100%',
      maxHeight: 400,
      objectFit: 'contain',
      display: 'block',
    },
    frame: {
      width: '100%',
      height: 400,
      border: 0,
      bgcolor: 'background.paper',
    },
  },
} as const

const AssetPreview = ({
  asset,
  variant,
}: {
  asset: IAsset
  variant: 'grid' | 'slideshow'
}) => {
  if (isImage(asset)) {
    return (
      <Box
        component="img"
        src={asset.signed_url}
        alt={asset.name}
        sx={previewStyles[variant].image}
      />
    )
  }

  if (isPdf(asset) || isText(asset)) {
    return (
      <Box
        component="iframe"
        src={asset.signed_url}
        title={asset.name}
        sx={previewStyles[variant].frame}
      />
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography color="text.secondary">Preview not available.</Typography>
    </Box>
  )
}

const AssetPreviewWithOverlay = ({
  asset,
  variant,
  refetchAssets,
}: {
  asset: IAsset
  variant: 'grid' | 'slideshow'
  refetchAssets: () => Promise<unknown>
}) => {
  const isSlideshow = variant === 'slideshow'

  const downloadAsset = async (
    asset: IAsset,
    refetchAssets: () => Promise<unknown>
  ) => {
    let response = await fetch(asset.signed_url)

    if (response.status === 403) {
      await refetchAssets()

      // This refetch updates React state, but this local asset still has
      // the old signed URL. User can click again after URLs refresh.
      return
    }

    if (!response.ok) {
      throw new Error('Failed to download asset')
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = asset.name || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(objectUrl)
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        '&:hover .asset-overlay': {
          opacity: 1,
        },
      }}
    >
      <AssetPreview asset={asset} variant={variant} />

      <Box
        className="asset-overlay"
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: isSlideshow ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          background: isSlideshow
            ? undefined
            : 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.05))',
          pointerEvents: 'none',
        }}
      />

      <Typography
        className="asset-overlay"
        variant="caption"
        sx={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          opacity: isSlideshow ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
          color: isSlideshow ? 'black' : 'white',
          maxWidth: '70%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {asset.name}
      </Typography>

      {asset.signed_url && (
        <Button
          variant="outlined"
          className="asset-overlay"
          size="small"
          component="a"
          href={asset.signed_url}
          onClick={(event) => {
            event.stopPropagation()
            downloadAsset(asset, refetchAssets)
          }}
          sx={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            opacity: isSlideshow ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: 'auto',
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'background.paper',
            },
          }}
        >
          Download
        </Button>
      )}
    </Box>
  )
}
