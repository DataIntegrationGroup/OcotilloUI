import { useMemo, useState } from 'react'
import { useCustomMutation, useList } from '@refinedev/core'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { invalidateWellDetails } from '@/hooks'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
  isRemoving,
  isBusy,
}: {
  name: string
  onRemove: () => void
  isRemoving: boolean
  isBusy: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 pr-0.75 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20',
        isRemoving && 'opacity-70'
      )}
      aria-busy={isRemoving}
    >
      {name}
      <button
        onClick={onRemove}
        disabled={isBusy}
        className="rounded-full p-0.5 hover:bg-primary/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label={isRemoving ? `Removing ${name}` : `Remove ${name}`}
      >
        {isRemoving ? (
          <Loader2 className="size-3 animate-spin" aria-hidden />
        ) : (
          <XIcon className="size-3" />
        )}
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

export function WellEditPanel({
  wellId,
  wellName,
  assignedGroups,
  isAssignedGroupsLoading = false,
  onClose,
}: WellEditPanelProps) {
  const queryClient = useQueryClient()
  const [selectKey, setSelectKey] = useState(0)
  const [removingGroupId, setRemovingGroupId] = useState<number | null>(null)
  const [addingGroupId, setAddingGroupId] = useState<number | null>(null)
  const [optimisticGroups, setOptimisticGroups] = useState<IGroup[] | null>(
    null
  )

  const currentGroups = optimisticGroups ?? assignedGroups
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

  const availableGroups = useMemo(() => {
    const groups = allGroupsResult?.data ?? []
    const assignedIds = new Set(currentGroups.map((g) => g.id))
    return groups
      .filter((g) => !assignedIds.has(g.id))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      )
  }, [allGroupsResult?.data, currentGroups])

  const { mutate } = useCustomMutation()
  const isProjectMutationPending =
    addingGroupId !== null || removingGroupId !== null

  const handleAddProject = (group: IGroup) => {
    setAddingGroupId(group.id)
    mutate(
      {
        url: `group/${group.id}/things/${wellId}`,
        method: 'post',
        values: {},
        dataProviderName: 'ocotillo',
      },
      {
        onSuccess: () => {
          setSelectKey((key) => key + 1)
          setOptimisticGroups((previous) => {
            const base = previous ?? assignedGroups
            if (base.some((item) => item.id === group.id)) {
              return base
            }
            return [...base, group].sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            )
          })
          void invalidateWellDetails(queryClient, wellId).finally(() => {
            setAddingGroupId(null)
            setOptimisticGroups(null)
          })
        },
        onError: () => {
          setAddingGroupId(null)
          setOptimisticGroups(null)
        },
      }
    )
  }

  const handleRemoveProject = (group: IGroup) => {
    setRemovingGroupId(group.id)
    mutate(
      {
        url: `group/${group.id}/things/${wellId}`,
        method: 'delete',
        values: {},
        dataProviderName: 'ocotillo',
      },
      {
        onSuccess: () => {
          setOptimisticGroups((previous) => {
            const base = previous ?? assignedGroups
            return base.filter((item) => item.id !== group.id)
          })
          void invalidateWellDetails(queryClient, wellId).finally(() => {
            setRemovingGroupId(null)
            setOptimisticGroups(null)
          })
        },
        onError: () => {
          setRemovingGroupId(null)
          setOptimisticGroups(null)
        },
      }
    )
  }

  return (
    <EditPanel
      title={panelTitle}
      onClose={onClose}
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <EditPanelSection title="Projects">
        {isAssignedGroupsLoading || isGroupsLoading ? (
          <ProjectsSectionSkeleton />
        ) : (
          <>
            <div className="col-span-2">
              {isProjectMutationPending && (
                <p className="sr-only" aria-live="polite">
                  Updating projects…
                </p>
              )}
              {currentGroups.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {currentGroups.map((group) => (
                    <ProjectChip
                      key={group.id}
                      name={group.name}
                      onRemove={() => handleRemoveProject(group)}
                      isRemoving={removingGroupId === group.id}
                      isBusy={isProjectMutationPending}
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
                disabled={
                  isProjectMutationPending || availableGroups.length === 0
                }
                onValueChange={(value) => {
                  const group = availableGroups.find(
                    (item) => String(item.id) === value
                  )
                  if (group) handleAddProject(group)
                }}
              >
                <SelectTrigger
                  className={cn(
                    'h-8 w-full text-sm',
                    isProjectMutationPending && 'text-muted-foreground'
                  )}
                  aria-busy={isProjectMutationPending}
                >
                  {addingGroupId !== null ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Adding project…
                    </span>
                  ) : removingGroupId !== null ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Removing project…
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={
                        availableGroups.length === 0
                          ? 'No projects available'
                          : 'Select project…'
                      }
                    />
                  )}
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
  )
}
