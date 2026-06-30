import { useEffect, useMemo, useRef, useState } from 'react'
import { useCustomMutation, useList, useNotification } from '@refinedev/core'
import { useQueryClient } from '@tanstack/react-query'
import { captureEvent } from '@/analytics/posthog'
import { Loader2, XIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EditPanel,
  EditPanelField,
  EditPanelSection,
} from '@/components/editing'
import { invalidateWellDetails, wellDetailsQueryKey } from '@/hooks'
import type { IWellDetails } from '@/interfaces/ocotillo'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'
import { Skeleton } from '@/components/ui/skeleton'

interface WellEditPanelProps {
  wellId: string | number
  wellName?: string | null
  assignedGroups: IGroup[]
  isAssignedGroupsLoading?: boolean
  onClose: () => void
}

function ProjectChip({
  name,
  onRemove,
  disabled,
}: {
  name: string
  onRemove: () => void
  disabled?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 pr-0.75 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
      {name}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="rounded-full p-0.5 hover:bg-primary/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label={`Remove ${name}`}
      >
        <XIcon className="size-3" />
      </button>
    </span>
  )
}

function ProjectsSectionSkeleton() {
  return (
    <>
      <div className="col-span-2 flex flex-wrap gap-1.5">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </>
  )
}

function sortGroupsByName(groups: IGroup[]) {
  return [...groups].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
}

function groupsHaveSameIds(a: IGroup[], b: IGroup[]) {
  if (a.length !== b.length) {
    return false
  }

  const ids = new Set(a.map((group) => group.id))
  return b.every((group) => ids.has(group.id))
}

function syncDraftFromQueryCache(
  queryClient: ReturnType<typeof useQueryClient>,
  wellId: string | number
) {
  const data = queryClient.getQueryData<IWellDetails>(
    wellDetailsQueryKey(wellId)
  )
  return sortGroupsByName(data?.well?.groups ?? [])
}

export function WellEditPanel({
  wellId,
  wellName,
  assignedGroups,
  isAssignedGroupsLoading = false,
  onClose,
}: WellEditPanelProps) {
  const queryClient = useQueryClient()
  const { open: notify } = useNotification()
  const { mutateAsync: mutateGroupThing, mutation } = useCustomMutation()

  const isSaving = mutation.isPending

  const [selectKey, setSelectKey] = useState(0)
  const [draftGroups, setDraftGroups] = useState<IGroup[]>([])
  const [initialGroups, setInitialGroups] = useState<IGroup[]>([])
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const wasLoadingRef = useRef(true)

  const panelTitle = wellName ? `Edit: ${wellName}` : 'Edit'

  const { result: allGroupsResult, query: groupsQuery } = useList<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 200 },
    filters: [
      { field: 'group_type', operator: 'ne', value: 'Geographic Area' },
      { field: 'group_type', operator: 'ne', value: 'Historical' },
    ],
  })
  const isGroupsLoading = groupsQuery.isLoading
  const isLoading = isAssignedGroupsLoading || isGroupsLoading

  useEffect(() => {
    captureEvent('edit_panel_opened', { resource: 'well', well_id: wellId })
  }, [wellId])

  useEffect(() => {
    wasLoadingRef.current = true
  }, [wellId])

  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true
      return
    }

    if (!wasLoadingRef.current) {
      return
    }

    const sorted = sortGroupsByName(assignedGroups)
    setDraftGroups(sorted)
    setInitialGroups(sorted)
    wasLoadingRef.current = false
  }, [assignedGroups, isLoading, wellId])

  const isDirty = useMemo(
    () => !groupsHaveSameIds(draftGroups, initialGroups),
    [draftGroups, initialGroups]
  )

  const availableGroups = useMemo(() => {
    const groups = allGroupsResult?.data ?? []
    const assignedIds = new Set(draftGroups.map((group) => group.id))
    return groups
      .filter((group) => !assignedIds.has(group.id))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      )
  }, [allGroupsResult?.data, draftGroups])

  const handleAddProject = (group: IGroup) => {
    setDraftGroups((previous) => sortGroupsByName([...previous, group]))
    setSelectKey((key) => key + 1)
  }

  const handleRemoveProject = (group: IGroup) => {
    setDraftGroups((previous) =>
      previous.filter((item) => item.id !== group.id)
    )
  }

  const resyncDraftFromServer = async () => {
    await invalidateWellDetails(queryClient, wellId)
    const sorted = syncDraftFromQueryCache(queryClient, wellId)
    setDraftGroups(sorted)
    setInitialGroups(sorted)
  }

  const handleSave = async () => {
    if (!isDirty || isSaving) {
      return
    }

    const initialIds = new Set(initialGroups.map((group) => group.id))
    const draftIds = new Set(draftGroups.map((group) => group.id))
    const toAdd = draftGroups.filter((group) => !initialIds.has(group.id))
    const toRemove = initialGroups.filter((group) => !draftIds.has(group.id))

    try {
      await Promise.all([
        ...toRemove.map((group) =>
          mutateGroupThing({
            url: `group/${group.id}/things/${wellId}`,
            method: 'delete',
            values: {},
            dataProviderName: 'ocotillo',
          })
        ),
        ...toAdd.map((group) =>
          mutateGroupThing({
            url: `group/${group.id}/things/${wellId}`,
            method: 'post',
            values: {},
            dataProviderName: 'ocotillo',
          })
        ),
      ])

      await invalidateWellDetails(queryClient, wellId)
      captureEvent('edit_saved', {
        resource: 'well',
        well_id: wellId,
        fields_changed: ['groups'],
      })
      onClose()
    } catch {
      notify?.({
        type: 'error',
        message: 'Could not save project changes. Please try again.',
      })
      await resyncDraftFromServer()
    }
  }

  const handleRequestClose = () => {
    if (isSaving) {
      return
    }

    if (isDirty) {
      setDiscardDialogOpen(true)
      return
    }

    onClose()
  }

  const handleDiscardChanges = () => {
    captureEvent('edit_abandoned', {
      resource: 'well',
      well_id: wellId,
      had_changes: isDirty,
    })
    onClose()
  }

  return (
    <>
      <EditPanel
        title={panelTitle}
        onClose={handleRequestClose}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestClose}
              disabled={isSaving}
            >
              Close
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </>
        }
      >
        <EditPanelSection title="Projects">
          {isLoading ? (
            <ProjectsSectionSkeleton />
          ) : (
            <>
              <div className="col-span-2">
                {draftGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {draftGroups.map((group) => (
                      <ProjectChip
                        key={group.id}
                        name={group.name}
                        onRemove={() => handleRemoveProject(group)}
                        disabled={isSaving}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No projects assigned yet.
                  </p>
                )}
              </div>

              <EditPanelField label="Add to project" span="full">
                <Select
                  key={selectKey}
                  disabled={isSaving || availableGroups.length === 0}
                  onValueChange={(value) => {
                    const group = availableGroups.find(
                      (item) => String(item.id) === value
                    )
                    if (group) {
                      handleAddProject(group)
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue
                      placeholder={
                        availableGroups.length === 0
                          ? 'No projects available'
                          : 'Select project…'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {availableGroups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.group_type
                          ? `${group.name} (${group.group_type})`
                          : group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditPanelField>
            </>
          )}
        </EditPanelSection>
      </EditPanel>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Project changes you have not saved will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleDiscardChanges}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
