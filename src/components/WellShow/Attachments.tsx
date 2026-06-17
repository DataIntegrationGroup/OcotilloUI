import { useMemo, useState } from 'react'
import {
  Box,
  ButtonBase,
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
import {
  GetListResponse,
  HttpError,
  useNotification,
  useCustomMutation,
} from '@refinedev/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button as UiButton } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE_IN_BYTES,
  MAX_UPLOAD_SIZE_IN_MB,
} from '@/constants'
import { formatFileSize, isImage, isPdf, isText } from '@/utils'
import { useAccessCapabilities } from '@/hooks'
import { CardHeaderTitle } from '@/components'
import { AssetPreviewWithOverlay } from '@/components/WellShow'

const ACCEPTED_FILE_TYPES = Array.from(ALLOWED_MIME_TYPES).join(',')
const ALLOWED_FILE_TYPES_LABEL = ALLOWED_FILE_EXTENSIONS.map((ext) =>
  ext.toUpperCase()
).join(', ')

type PreviewViewMode = 'grid' | 'slideshow'
type UploadPreview = {
  id: string
  file: File
  previewUrl: string | null
  textPreview: string | null
  error?: string
}

const canPreview = (asset: IAsset) =>
  Boolean(asset.signed_url) && (isImage(asset) || isPdf(asset) || isText(asset))

const canPreviewFile = (file: File) =>
  file.type.startsWith('image/') ||
  file.type === 'application/pdf' ||
  file.type === 'text/plain'

const getUploadValidationError = (file: File) => {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return 'File type is not supported.'
  }

  if (file.size > MAX_UPLOAD_SIZE_IN_BYTES) {
    return `File exceeds the ${MAX_UPLOAD_SIZE_IN_MB} MB size limit.`
  }

  return null
}

const getUploadErrorMessage = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const responseData = error.response.data as {
      detail?: Array<{ msg?: string }> | string
    }

    if (Array.isArray(responseData.detail) && responseData.detail[0]?.msg) {
      return responseData.detail[0].msg
    }

    if (typeof responseData.detail === 'string') {
      return responseData.detail
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Upload failed. Please try again.'
}

const revokePreviewUrl = (preview: UploadPreview) => {
  if (preview.previewUrl) {
    URL.revokeObjectURL(preview.previewUrl)
  }
}

const buildUploadPreview = async (file: File): Promise<UploadPreview> => {
  const validationError = getUploadValidationError(file)
  const previewUrl = canPreviewFile(file) ? URL.createObjectURL(file) : null
  const textPreview =
    file.type === 'text/plain' ? (await file.text()).slice(0, 5000) : null

  return {
    id: crypto.randomUUID(),
    file,
    previewUrl,
    textPreview,
    error: validationError ?? undefined,
  }
}

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
  const { open: notify } = useNotification()
  const [previewViewMode, setPreviewViewMode] =
    useState<PreviewViewMode>('grid')
  const [slideshowIndex, setSlideshowIndex] = useState(0)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadPreviews, setUploadPreviews] = useState<UploadPreview[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const previewAssets = useMemo(() => assets.filter(canPreview), [assets])

  const currentAsset = previewAssets[slideshowIndex]
  const hasAssets = previewAssets.length > 0

  const { canManageAmp } = useAccessCapabilities()

  const clearUploadState = () => {
    setUploadPreviews((currentPreviews) => {
      currentPreviews.forEach(revokePreviewUrl)
      return []
    })
    setUploadError(null)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && uploadAssetMutation.isPending) {
      return
    }

    setIsUploadDialogOpen(open)

    if (!open) {
      clearUploadState()
    }
  }

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (selectedFiles.length === 0) {
      return
    }

    const nextPreviews = await Promise.all(
      selectedFiles.map((file) => buildUploadPreview(file))
    )

    setUploadPreviews((currentPreviews) => [
      ...currentPreviews,
      ...nextPreviews,
    ])
    setUploadError(null)
    event.target.value = ''
  }

  const handleRemoveUpload = (previewId: string) => {
    setUploadPreviews((currentPreviews) => {
      const previewToRemove = currentPreviews.find(
        (preview) => preview.id === previewId
      )

      if (previewToRemove) {
        revokePreviewUrl(previewToRemove)
      }

      return currentPreviews.filter((preview) => preview.id !== previewId)
    })
  }

  const uploadAssetPreview = async (preview: UploadPreview) => {
    if (!thingId) {
      throw new Error('A well id is required before files can be uploaded.')
    }

    const formData = new FormData()
    formData.append('file', preview.file)
    formData.append('thing_id', String(thingId))
    formData.append('label', preview.file.name)
    formData.append('name', preview.file.name)

    return uploadAsset({
      url: 'asset/upload-and-record',
      method: 'post',
      values: formData,
      dataProviderName: 'ocotillo',
    })
  }

  const { mutateAsync: uploadAsset, mutation: uploadAssetMutation } =
    useCustomMutation()

  const handleUploadSubmit = async () => {
    if (!thingId) {
      setUploadError('A well id is required before files can be uploaded.')
      return
    }

    if (uploadPreviews.length === 0) {
      setUploadError('Select at least one file to upload.')
      return
    }

    if (uploadPreviews.some((preview) => preview.error)) {
      setUploadError('Remove invalid files before uploading.')
      return
    }

    setUploadError(null)

    const failedPreviewIds = new Set<string>()
    let uploadedCount = 0

    for (const preview of uploadPreviews) {
      try {
        await uploadAssetPreview(preview)

        revokePreviewUrl(preview)
        uploadedCount += 1
      } catch (error) {
        console.error(error)

        failedPreviewIds.add(preview.id)
        const message = getUploadErrorMessage(error)
        setUploadPreviews((currentPreviews) =>
          currentPreviews.map((currentPreview) =>
            currentPreview.id === preview.id
              ? { ...currentPreview, error: message }
              : currentPreview
          )
        )
      }
    }

    if (uploadedCount > 0) {
      await refetchAssets()
      notify?.({
        type: 'success',
        message:
          uploadedCount === 1
            ? 'Attachment uploaded'
            : `${uploadedCount} attachments uploaded`,
      })
    }

    setUploadPreviews((currentPreviews) =>
      currentPreviews
        .filter((preview) => failedPreviewIds.has(preview.id))
        .map((preview) => ({
          ...preview,
          error:
            preview.error ?? 'Upload failed. Review this file and try again.',
        }))
    )

    if (failedPreviewIds.size > 0) {
      setUploadError(
        uploadedCount > 0
          ? 'Some files could not be uploaded.'
          : 'No files were uploaded.'
      )
      notify?.({
        type: 'error',
        message: 'Attachment upload failed',
        description: 'Review the files in the dialog and try again.',
      })
      return
    }

    handleDialogOpenChange(false)
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
      </CardContent>
      <Dialog open={isUploadDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload attachments</DialogTitle>
            <DialogDescription>
              Add files for this well, preview them before upload, and save them
              as attachments.
            </DialogDescription>
          </DialogHeader>

          <Box className="space-y-4">
            <Box className="space-y-2">
              <Label htmlFor="well-attachment-upload">Files</Label>
              <Input
                id="well-attachment-upload"
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileSelection}
                className="h-auto cursor-pointer py-2"
              />
              <Typography className="text-muted-foreground text-sm">
                Allowed types: {ALLOWED_FILE_TYPES_LABEL}. Maximum file size:{' '}
                {MAX_UPLOAD_SIZE_IN_MB} MB.
              </Typography>
              {uploadError ? (
                <p className="text-sm text-red-600">{uploadError}</p>
              ) : null}
            </Box>

            {uploadPreviews.length > 0 ? (
              <Box className="grid gap-4 md:grid-cols-2">
                {uploadPreviews.map((preview) => (
                  <Box
                    key={preview.id}
                    className="bg-background rounded-lg border p-4"
                  >
                    <Box className="mb-3 flex items-start justify-between gap-3">
                      <Box className="min-w-0">
                        <Typography className="truncate text-sm font-medium">
                          {preview.file.name}
                        </Typography>
                        <Typography className="text-muted-foreground text-xs">
                          {preview.file.type || 'Unknown file type'} ·{' '}
                          {formatFileSize(preview.file.size)}
                        </Typography>
                      </Box>
                      <UiButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUpload(preview.id)}
                        disabled={uploadAssetMutation.isPending}
                      >
                        Remove
                      </UiButton>
                    </Box>

                    <Box className="bg-muted flex min-h-40 items-center justify-center overflow-hidden rounded-md border">
                      {preview.file.type.startsWith('image/') &&
                      preview.previewUrl ? (
                        <Box
                          component="img"
                          src={preview.previewUrl}
                          alt={preview.file.name}
                          className="max-h-64 w-full object-contain"
                        />
                      ) : preview.file.type === 'application/pdf' &&
                        preview.previewUrl ? (
                        <Box
                          component="iframe"
                          src={preview.previewUrl}
                          title={preview.file.name}
                          className="h-64 w-full border-0"
                        />
                      ) : preview.file.type === 'text/plain' ? (
                        <Typography className="max-h-64 w-full overflow-auto p-3 text-xs whitespace-pre-wrap">
                          {preview.textPreview}
                        </Typography>
                      ) : (
                        <Typography className="text-muted-foreground p-3 text-sm text-center">
                          Preview not available for this file.
                        </Typography>
                      )}
                    </Box>

                    {preview.error && (
                      <Box className="mt-3">
                        <Typography className="mb-3 text-sm text-red-600">
                          {preview.error}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
                No files selected yet.
              </Typography>
            )}
          </Box>

          <DialogFooter>
            <UiButton
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={uploadAssetMutation.isPending}
            >
              Cancel
            </UiButton>
            <UiButton
              type="button"
              onClick={handleUploadSubmit}
              disabled={
                uploadAssetMutation.isPending || uploadPreviews.length === 0
              }
            >
              {uploadAssetMutation.isPending ? 'Uploading...' : 'Upload files'}
            </UiButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
