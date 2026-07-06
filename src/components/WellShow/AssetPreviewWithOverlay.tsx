import { Box, Typography, Button } from '@mui/material'
import type { IAsset } from '@/interfaces/ocotillo'
import { QueryObserverResult } from '@tanstack/react-query'
import { GetListResponse, HttpError } from '@refinedev/core'
import { HttpStatus } from '@/enums'
import { isImage, isPdf, isText } from '@/utils'
import { AssetActions } from '@/components/WellShow/AssetActions'

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
      pointerEvents: 'none',
    },
  },
  slideshow: {
    image: {
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      objectFit: 'contain',
      display: 'block',
    },
    frame: {
      width: '100%',
      height: '100%',
      border: 0,
      bgcolor: 'background.paper',
      pointerEvents: 'auto',
    },
  },
  full: {
    image: {
      width: '100%',
      maxWidth: '100%',
      maxHeight: '72vh',
      objectFit: 'contain',
      display: 'block',
    },
    frame: {
      width: '100%',
      height: '72vh',
      border: 0,
      bgcolor: 'background.paper',
      pointerEvents: 'auto',
    },
  },
} as const

export const AssetPreview = ({
  asset,
  variant,
}: {
  asset: IAsset
  variant: 'grid' | 'slideshow' | 'full'
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

export const AssetPreviewWithOverlay = ({
  asset,
  variant,
  refetchAssets,
  canManageAsset = false,
  onViewMore,
  slideshowCaption,
}: {
  asset: IAsset
  variant: 'grid' | 'slideshow'
  refetchAssets: () => Promise<
    QueryObserverResult<GetListResponse<IAsset>, HttpError>
  >
  canManageAsset?: boolean
  onViewMore?: () => void
  slideshowCaption?: string
}) => {
  const isSlideshow = variant === 'slideshow'

  const getRefreshedAsset = async (
    assetId: IAsset['id'],
    refetchAssetsQuery: () => Promise<
      QueryObserverResult<GetListResponse<IAsset>, HttpError>
    >
  ) => {
    const refetchResult = await refetchAssetsQuery()
    const refreshedAssets = refetchResult.data?.data ?? []

    const refreshedAsset = refreshedAssets.find(
      (item: IAsset) => item.id === assetId
    )

    if (!refreshedAsset?.signed_url) {
      throw new Error('Could not refresh signed URL')
    }

    return refreshedAsset
  }

  const downloadAsset = async (
    asset: IAsset,
    refetchAssetsQuery: () => Promise<
      QueryObserverResult<GetListResponse<IAsset>, HttpError>
    >
  ) => {
    const downloadFromUrl = async (url: string, fileName: string) => {
      const response = await fetch(url)

      if (!response.ok) {
        throw response
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName || 'download'
      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(objectUrl)
    }

    try {
      await downloadFromUrl(asset.signed_url, asset.name)
    } catch (error) {
      if (
        !(error instanceof Response) ||
        error.status !== HttpStatus.FORBIDDEN
      ) {
        throw error
      }

      const refreshedAsset = await getRefreshedAsset(
        asset.id,
        refetchAssetsQuery
      )
      await downloadFromUrl(refreshedAsset.signed_url, refreshedAsset.name)
    }
  }

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: isSlideshow ? '100%' : undefined,
          display: isSlideshow ? 'flex' : 'block',
          flexDirection: isSlideshow ? 'column' : undefined,
          '&:hover .asset-overlay': {
            opacity: 1,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            minHeight: 0,
            flex: isSlideshow ? '1 1 auto' : undefined,
            display: isSlideshow ? 'flex' : 'block',
            alignItems: isSlideshow ? 'center' : undefined,
            justifyContent: isSlideshow ? 'center' : undefined,
            overflow: 'hidden',
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
        </Box>

        {isSlideshow ? (
          <Box
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
              gridTemplateAreas: `
                "name caption actions"
                "label label label"
              `,
              gap: 1,
              alignItems: 'center',
              px: 1.5,
              py: 1,
            }}
          >
            <Typography
              variant="body1"
              title={asset.name}
              sx={{
                gridArea: 'name',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {asset.name}
            </Typography>

            {slideshowCaption && (
              <Typography
                variant="caption"
                sx={{
                  gridArea: 'caption',
                  justifySelf: 'center',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {slideshowCaption}
              </Typography>
            )}

            <Box
              sx={{
                gridArea: 'actions',
                display: 'flex',
                gap: 1,
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {asset.signed_url && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation()

                    if (!asset.signed_url) return
                    void downloadAsset(asset, refetchAssets).catch(
                      console.error
                    )
                  }}
                >
                  Download
                </Button>
              )}

              {canManageAsset && (
                <AssetActions
                  asset={asset}
                  refetchAssets={refetchAssets}
                  allowLabelEdit
                />
              )}
            </Box>

            <Typography
              variant="body2"
              title={asset.label}
              color="text.secondary"
              sx={{
                gridArea: 'label',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {asset.label}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: 'background.paper',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 1,
              alignItems: 'center',
              px: 1,
              py: 0.75,
            }}
          >
            <Typography
              variant="caption"
              title={asset?.name}
              sx={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {asset?.name}
            </Typography>

            {onViewMore && (
              <Button
                size="small"
                variant="text"
                onClick={(event) => {
                  event.stopPropagation()
                  onViewMore()
                }}
                sx={{ minWidth: 'auto', px: 0.5, py: 0, fontSize: 12 }}
              >
                View more
              </Button>
            )}
          </Box>
        )}

        {!isSlideshow && (
          <Box
            className="asset-overlay"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              opacity: isSlideshow ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
              pointerEvents: 'auto',
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {asset.signed_url && (
              <Button
                variant="outlined"
                size="small"
                onClick={(event) => {
                  event.stopPropagation()

                  if (!asset?.signed_url) return
                  void downloadAsset(asset, refetchAssets).catch(console.error)
                }}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                }}
              >
                Download
              </Button>
            )}

            {canManageAsset && (
              <AssetActions asset={asset} refetchAssets={refetchAssets} />
            )}
          </Box>
        )}
      </Box>
    </>
  )
}
