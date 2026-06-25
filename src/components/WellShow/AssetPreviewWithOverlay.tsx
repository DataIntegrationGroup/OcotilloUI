import { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import type { IAsset } from '@/interfaces/ocotillo'
import { QueryObserverResult } from '@tanstack/react-query'
import {
  GetListResponse,
  HttpError,
  useCustomMutation,
  useNotification,
} from '@refinedev/core'
import { HttpStatus } from '@/enums'
import { isImage, isPdf, isText } from '@/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button as UiButton } from '@/components/ui/button'
import { MoreVertical, Trash2, Unlink } from 'lucide-react'

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
      pointerEvents: 'auto',
    },
  },
} as const

export const AssetPreview = ({
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

export const AssetPreviewWithOverlay = ({
  asset,
  variant,
  refetchAssets,
  canManageAsset = false,
}: {
  asset: IAsset
  variant: 'grid' | 'slideshow'
  refetchAssets: () => Promise<
    QueryObserverResult<GetListResponse<IAsset>, HttpError>
  >
  canManageAsset?: boolean
}) => {
  const isSlideshow = variant === 'slideshow'
  const { open: notify } = useNotification()
  const { mutateAsync: mutateAsset, mutation: assetMutation } =
    useCustomMutation()
  const [confirmAction, setConfirmAction] = useState<
    'remove-association' | 'delete-asset' | null
  >(null)

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

  const getMutationErrorMessage = (error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'data' in error.response
    ) {
      const responseData = error.response.data as { detail?: string }

      if (typeof responseData.detail === 'string') {
        return responseData.detail
      }
    }

    if (error instanceof Error && error.message) {
      return error.message
    }

    return 'Request failed. Please try again.'
  }

  const handleConfirmAssetAction = async () => {
    if (!confirmAction) return

    const isRemoveAssociation = confirmAction === 'remove-association'

    try {
      await mutateAsset({
        url: isRemoveAssociation
          ? `asset/${asset.id}/remove`
          : `asset/${asset.id}`,
        method: 'delete',
        values: {},
        dataProviderName: 'ocotillo',
      })

      await refetchAssets()

      notify?.({
        type: 'success',
        message: isRemoveAssociation
          ? 'Attachment removed from well'
          : 'Attachment deleted',
      })
    } catch (error) {
      console.error(error)
      notify?.({
        type: 'error',
        message: isRemoveAssociation
          ? 'Could not remove attachment from well'
          : 'Could not delete attachment',
        description: getMutationErrorMessage(error),
      })
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <>
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
            maxWidth: canManageAsset ? '52%' : '70%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {asset.name}
        </Typography>

        <Box
          className="asset-overlay"
          sx={{
            position: 'absolute',
            right: 8,
            bottom: 8,
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UiButton
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Attachment actions for ${asset.name}`}
                  onClick={(event) => event.stopPropagation()}
                  disabled={assetMutation.isPending}
                  className="bg-background hover:bg-background"
                >
                  <MoreVertical />
                </UiButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation()
                    setConfirmAction('remove-association')
                  }}
                >
                  <Unlink />
                  Remove from this well
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    setConfirmAction('delete-asset')
                  }}
                >
                  <Trash2 />
                  Delete asset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Box>
      </Box>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !assetMutation.isPending) {
            setConfirmAction(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'remove-association'
                ? 'Remove attachment from this well?'
                : 'Delete this asset?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'remove-association'
                ? 'The asset will remain uploaded, but it will no longer be associated with this well.'
                : 'This permanently deletes the uploaded asset record. Use this only when the file should not be kept.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={assetMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmAssetAction()
              }}
              disabled={assetMutation.isPending}
              className={
                confirmAction === 'delete-asset'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              }
            >
              {assetMutation.isPending
                ? 'Working...'
                : confirmAction === 'remove-association'
                  ? 'Remove from well'
                  : 'Delete asset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
