import { useState } from 'react'
import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import { useCustomMutation, useNotification } from '@refinedev/core'
import { useAutocomplete } from '@refinedev/mui'
import { Link2, MoreVertical, Pencil, Trash2, Unlink } from 'lucide-react'
import type { IAsset, IWell } from '@/interfaces/ocotillo'
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
import { Button as UiButton } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type AssetAction = 'disassociate-asset' | 'delete-asset'
type AssetEditForm = {
  name: string
  label: string
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

export const AssetActions = ({
  asset,
  refetchAssets,
  allowAssetEdit = false,
  includeDisassociate = true,
  noun = 'attachment',
}: {
  asset: IAsset
  refetchAssets: () => Promise<unknown>
  allowAssetEdit?: boolean
  includeDisassociate?: boolean
  noun?: 'asset' | 'attachment'
}) => {
  const { open: notify } = useNotification()
  const { mutateAsync: mutateAsset, mutation: assetMutation } =
    useCustomMutation()
  const [confirmAction, setConfirmAction] = useState<AssetAction | null>(null)
  const [isReassociateDialogOpen, setIsReassociateDialogOpen] = useState(false)
  const [isEditAssetDialogOpen, setIsEditAssetDialogOpen] = useState(false)
  const [editAssetValue, setEditAssetValue] = useState<AssetEditForm>({
    name: '',
    label: '',
  })
  const [selectedWell, setSelectedWell] = useState<IWell | null>(null)
  const capitalizedNoun = noun[0].toUpperCase() + noun.slice(1)

  const { autocompleteProps: wellAutocompleteProps } = useAutocomplete<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    queryOptions: {
      enabled: isReassociateDialogOpen,
    },
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  const handleConfirmAssetAction = async () => {
    if (!confirmAction) return

    const isDisassociate = confirmAction === 'disassociate-asset'

    try {
      if (isDisassociate) {
        await mutateAsset({
          url: `asset/${asset.id}/association`,
          method: 'patch',
          values: { thing_id: null },
          dataProviderName: 'ocotillo',
        })
      } else {
        await mutateAsset({
          url: `asset/${asset.id}`,
          method: 'delete',
          values: {},
          dataProviderName: 'ocotillo',
        })
      }

      await refetchAssets()

      notify?.({
        type: 'success',
        message: isDisassociate
          ? `${capitalizedNoun} disassociated`
          : `${capitalizedNoun} deleted`,
      })
    } catch (error) {
      console.error(error)
      notify?.({
        type: 'error',
        message: isDisassociate
          ? `Could not disassociate ${noun}`
          : `Could not delete ${noun}`,
        description: getMutationErrorMessage(error),
      })
    } finally {
      setConfirmAction(null)
    }
  }

  const handleReassociateAsset = async () => {
    if (!selectedWell) return

    try {
      await mutateAsset({
        url: `asset/${asset.id}/association`,
        method: 'patch',
        values: { thing_id: selectedWell.id },
        dataProviderName: 'ocotillo',
      })

      await refetchAssets()
      notify?.({
        type: 'success',
        message: `${capitalizedNoun} reassociated`,
        description: selectedWell.name
          ? `${capitalizedNoun} moved to ${selectedWell.name}.`
          : undefined,
      })
      setIsReassociateDialogOpen(false)
      setSelectedWell(null)
    } catch (error) {
      console.error(error)
      notify?.({
        type: 'error',
        message: `Could not reassociate ${noun}`,
        description: getMutationErrorMessage(error),
      })
    }
  }

  const openEditAssetDialog = () => {
    setEditAssetValue({
      name: asset.name ?? '',
      label: asset.label ?? '',
    })
    setIsEditAssetDialogOpen(true)
  }

  const handleUpdateAsset = async () => {
    try {
      await mutateAsset({
        url: `asset/${asset.id}`,
        method: 'patch',
        values: editAssetValue,
        dataProviderName: 'ocotillo',
      })

      await refetchAssets()
      notify?.({
        type: 'success',
        message: `${capitalizedNoun} updated`,
      })
      setIsEditAssetDialogOpen(false)
    } catch (error) {
      console.error(error)
      notify?.({
        type: 'error',
        message: `Could not update ${noun}`,
        description: getMutationErrorMessage(error),
      })
    }
  }

  const currentThingId = asset.thing_id ?? null
  const wellOptions = ((wellAutocompleteProps.options ?? []) as IWell[]).filter(
    (well) => well.id !== currentThingId
  )
  const canOpenAssetEdit = allowAssetEdit && Boolean(asset.name)
  const isEditUnchanged =
    editAssetValue.name === (asset.name ?? '') &&
    editAssetValue.label === (asset.label ?? '')

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UiButton
            type="button"
            variant="outline"
            size="icon"
            aria-label={`${capitalizedNoun} actions for ${asset.name}`}
            disabled={assetMutation.isPending}
            className="bg-background hover:bg-background"
          >
            <MoreVertical />
          </UiButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {canOpenAssetEdit && (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                openEditAssetDialog()
              }}
            >
              <Pencil />
              Edit asset
            </DropdownMenuItem>
          )}
          {includeDisassociate && (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                setConfirmAction('disassociate-asset')
              }}
            >
              <Unlink />
              Disassociate {noun}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation()
              setSelectedWell(null)
              setIsReassociateDialogOpen(true)
            }}
          >
            <Link2 />
            Reassociate {noun}
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
            Delete {noun}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
              {confirmAction === 'disassociate-asset'
                ? `Disassociate this ${noun}?`
                : `Delete this ${noun}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'disassociate-asset'
                ? 'The asset will remain uploaded, but it will no longer be associated with any well.'
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
                : confirmAction === 'disassociate-asset'
                  ? `Disassociate ${noun}`
                  : `Delete ${noun}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isReassociateDialogOpen}
        onOpenChange={(open) => {
          if (!open && assetMutation.isPending) {
            return
          }

          setIsReassociateDialogOpen(open)

          if (!open) {
            setSelectedWell(null)
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Reassociate {noun}</DialogTitle>
            <DialogDescription>
              Move this {noun} to one well. It will be removed from any current
              well association.
            </DialogDescription>
          </DialogHeader>

          <Box className="space-y-2">
            <Autocomplete
              {...wellAutocompleteProps}
              disablePortal
              options={wellOptions}
              loading={Boolean(wellAutocompleteProps.loading)}
              value={selectedWell}
              filterOptions={(options) => options}
              getOptionLabel={(well) => well?.name ?? ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => setSelectedWell(value)}
              renderOption={({ key, ...props }, well) => (
                <Box component="li" key={key} {...props}>
                  <Typography variant="body2">{well.name}</Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Well"
                  placeholder="Search by well name"
                  size="small"
                />
              )}
            />
          </Box>

          <DialogFooter>
            <UiButton
              type="button"
              variant="outline"
              onClick={() => setIsReassociateDialogOpen(false)}
              disabled={assetMutation.isPending}
            >
              Cancel
            </UiButton>
            <UiButton
              type="button"
              onClick={() => void handleReassociateAsset()}
              disabled={!selectedWell || assetMutation.isPending}
            >
              {assetMutation.isPending ? 'Working...' : 'Reassociate'}
            </UiButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditAssetDialogOpen}
        onOpenChange={(open) => {
          if (!open && assetMutation.isPending) {
            return
          }

          setIsEditAssetDialogOpen(open)

          if (open) {
            setEditAssetValue({
              name: asset.name ?? '',
              label: asset.label ?? '',
            })
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit {noun}</DialogTitle>
            <DialogDescription>
              Update the name and label shown for this {noun}.
            </DialogDescription>
          </DialogHeader>

          <Box className="space-y-3">
            <TextField
              label="Name"
              value={editAssetValue.name}
              onChange={(event) =>
                setEditAssetValue((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              size="small"
              fullWidth
              autoFocus
            />
            <TextField
              label="Label"
              value={editAssetValue.label}
              onChange={(event) =>
                setEditAssetValue((current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }
              size="small"
              fullWidth
              multiline
              minRows={3}
              maxRows={10}
              sx={{
                '& textarea': {
                  resize: 'vertical',
                },
              }}
            />
          </Box>

          <DialogFooter>
            <UiButton
              type="button"
              variant="outline"
              onClick={() => setIsEditAssetDialogOpen(false)}
              disabled={assetMutation.isPending}
            >
              Cancel
            </UiButton>
            <UiButton
              type="button"
              onClick={() => void handleUpdateAsset()}
              disabled={isEditUnchanged || assetMutation.isPending}
            >
              {assetMutation.isPending ? 'Saving...' : 'Save asset'}
            </UiButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
