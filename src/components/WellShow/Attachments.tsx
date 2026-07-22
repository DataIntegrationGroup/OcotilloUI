import { useMemo, useState } from 'react'
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Button as MuiButton,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  FileUpload,
  GridView,
  Image,
  ViewCarousel,
} from '@mui/icons-material'
import { Masonry } from '@mui/lab'
import type { IAsset } from '@/interfaces/ocotillo'
import { QueryObserverResult } from '@tanstack/react-query'
import { GetListResponse, HttpError } from '@refinedev/core'
import { isImage, isPdf, isText } from '@/utils'
import { useAccessCapabilities } from '@/hooks'
import { CardHeaderTitle } from '@/components'
import {
  AssetPreviewWithOverlay,
  AttachmentsUploadDialog,
} from '@/components/WellShow'

type PreviewViewMode = 'grid' | 'slideshow'

const canPreview = (asset: IAsset) =>
  Boolean(asset.signed_url) && (isImage(asset) || isPdf(asset) || isText(asset))

const HeaderTitle = () => (
  <CardHeaderTitle icon={<Image color="primary" />} title="Attachments" />
)

export const AttachmentsCard = ({
  assets,
  isLoading,
  refetchAssets,
  thingId,
}: {
  assets: IAsset[]
  isLoading: boolean
  refetchAssets: () => Promise<
    QueryObserverResult<GetListResponse<IAsset>, HttpError>
  >
  thingId?: number | null
}) => {
  const [previewViewMode, setPreviewViewMode] =
    useState<PreviewViewMode>('grid')
  const [slideshowIndex, setSlideshowIndex] = useState(0)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const previewAssets = useMemo(() => assets.filter(canPreview), [assets])

  const currentAsset = previewAssets[slideshowIndex]
  const hasAssets = previewAssets.length > 0

  const { canManageAmp } = useAccessCapabilities()

  const openSlideshow = (index: number) => {
    setSlideshowIndex(index)
    setPreviewViewMode('slideshow')
  }

  return (
    <Card
      elevation={2}
      sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
      <CardHeader
        title={<HeaderTitle />}
        sx={{ pb: 0.5 }}
        action={
          canManageAmp && (
            <MuiButton
              onClick={() => setIsUploadDialogOpen(true)}
              startIcon={<FileUpload />}
              size="small"
              variant="text"
            >
              Upload File
            </MuiButton>
          )
        }
      />
      <CardContent sx={{ pb: 0 }}>
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
                      <Box
                        key={asset.id ?? idx}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open ${asset.name || `attachment ${idx + 1}`} in slideshow`}
                        onClick={(event) => {
                          const target = event.target

                          if (
                            target instanceof Node &&
                            !event.currentTarget.contains(target)
                          ) {
                            return
                          }

                          openSlideshow(idx)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openSlideshow(idx)
                          }
                        }}
                        sx={{
                          display: 'block',
                          width: '100%',
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: 2,
                          textAlign: 'left',
                          cursor: 'pointer',
                          outline: 'none',
                          '&:focus-visible': {
                            boxShadow: 4,
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 2,
                          },
                        }}
                      >
                        <AssetPreviewWithOverlay
                          asset={asset}
                          variant="grid"
                          refetchAssets={refetchAssets}
                          canManageAsset={canManageAmp}
                          onViewMore={() => openSlideshow(idx)}
                        />
                      </Box>
                    ))}
                  </Masonry>
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'auto',
                      boxShadow: 2,
                      bgcolor: 'grey.100',
                      minHeight: 360,
                      height: 480,
                      resize: 'vertical',
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
                        canManageAsset={canManageAmp}
                        slideshowCaption={`${slideshowIndex + 1} / ${
                          previewAssets.length
                        }`}
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
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
      <AttachmentsUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        refetchAssets={refetchAssets}
        thingId={thingId}
      />
    </Card>
  )
}
