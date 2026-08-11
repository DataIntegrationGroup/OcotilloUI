import { useNotification, useOne, useUpdate } from '@refinedev/core'
import { Loader2, MapIcon, UploadIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { captureEvent } from '@/analytics/posthog'
import {
  EditPanel,
  EditPanelField,
  EditPanelSection,
} from '@/components/editing'
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
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAccessCapabilities, useLexicon } from '@/hooks'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'
import { parseProjectBoundaryGeoJson } from '@/utils'

interface ProjectEditPanelProps {
  projectId: string | number
  projectName?: string | null
  onClose: () => void
}

/** Fields this panel can send to PATCH /group/{id}. */
type ProjectDraft = {
  name: string
  description: string
  release_status: string
  group_type: string
  /** WKT, the shape the API stores in group.project_area. */
  project_area: string
}

const EMPTY_DRAFT: ProjectDraft = {
  name: '',
  description: '',
  release_status: '',
  group_type: '',
  project_area: '',
}

const MAX_BOUNDARY_FILE_BYTES = 10 * 1024 * 1024

function draftFromProject(project: IGroup | undefined): ProjectDraft {
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    release_status: project?.release_status ?? '',
    group_type: project?.group_type ?? '',
    project_area:
      typeof project?.project_area === 'string' ? project.project_area : '',
  }
}

function FieldsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <div key={row} className="col-span-2 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ))}
    </>
  )
}

export function ProjectEditPanel({
  projectId,
  projectName,
  onClose,
}: ProjectEditPanelProps) {
  const { open: notify } = useNotification()
  const { canManageAmp } = useAccessCapabilities()
  const { mutateAsync: updateProject, mutation } = useUpdate()

  const isSaving = mutation.isPending

  const [draft, setDraft] = useState<ProjectDraft>(EMPTY_DRAFT)
  const [initial, setInitial] = useState<ProjectDraft>(EMPTY_DRAFT)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [boundaryError, setBoundaryError] = useState<string | null>(null)
  const [boundaryFileName, setBoundaryFileName] = useState<string | null>(null)
  const wasLoadingRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { query: projectQuery, result: project } = useOne<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    id: projectId,
    queryOptions: { enabled: Boolean(projectId) },
  })

  const { options: releaseStatusOptions, isLoading: isReleaseStatusLoading } =
    useLexicon({ category: 'release_status' })
  const { options: groupTypeOptions, isLoading: isGroupTypeLoading } =
    useLexicon({ category: 'group_type' })

  const isLoading = projectQuery.isLoading

  useEffect(() => {
    captureEvent('edit_panel_opened', {
      resource: 'project',
      project_id: projectId,
    })
  }, [projectId])

  useEffect(() => {
    wasLoadingRef.current = true
  }, [projectId])

  // Seed the draft once per project, so typing is not clobbered by refetches.
  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true
      return
    }

    if (!wasLoadingRef.current) {
      return
    }

    const next = draftFromProject(project)
    setDraft(next)
    setInitial(next)
    wasLoadingRef.current = false
  }, [isLoading, project, projectId])

  const changedFields = useMemo(
    () =>
      (Object.keys(draft) as (keyof ProjectDraft)[]).filter(
        (field) => draft[field] !== initial[field]
      ),
    [draft, initial]
  )

  const isDirty = changedFields.length > 0
  const isNameInvalid = draft.name.trim().length === 0

  const panelTitle = projectName ? `Edit: ${projectName}` : 'Edit project'

  const setField = (field: keyof ProjectDraft, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }))
  }

  const handleBoundaryFile = async (file: File | undefined) => {
    // Reset first so re-picking the same file after an error still registers.
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    setBoundaryError(null)
    setBoundaryFileName(null)

    if (file.size > MAX_BOUNDARY_FILE_BYTES) {
      setBoundaryError(
        'File is larger than 10 MB. Simplify it before uploading.'
      )
      return
    }

    const result = parseProjectBoundaryGeoJson(await file.text())

    if ('error' in result) {
      setBoundaryError(result.error)
      return
    }

    setField('project_area', result.wkt)
    setBoundaryFileName(file.name)
    captureEvent('project_boundary_uploaded', {
      project_id: projectId,
      file_name: file.name,
    })
  }

  const handleRemoveBoundary = () => {
    setBoundaryError(null)
    setBoundaryFileName(null)
    setField('project_area', '')
  }

  const handleSave = async () => {
    if (!isDirty || isSaving || isNameInvalid) {
      return
    }

    const values: Record<string, string | null> = {}
    for (const field of changedFields) {
      const value = draft[field].trim()
      // The API treats description and release_status as nullable; name is not.
      values[field] = field === 'name' ? value : value === '' ? null : value
    }

    try {
      await updateProject({
        resource: 'group',
        dataProviderName: 'ocotillo',
        id: projectId,
        values,
      })

      captureEvent('edit_saved', {
        resource: 'project',
        project_id: projectId,
        fields_changed: changedFields,
      })
      onClose()
    } catch (error) {
      // group has a unique (name, group_type) constraint, so a rename or a type
      // change can collide with an existing project.
      const status = (error as { statusCode?: number })?.statusCode
      notify?.({
        type: 'error',
        message:
          status === 409
            ? 'Another project already uses this name and type.'
            : 'Could not save project changes. Please try again.',
      })
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
      resource: 'project',
      project_id: projectId,
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
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isSaving || isNameInvalid}
            >
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
        <EditPanelSection title="Details">
          {isLoading ? (
            <FieldsSkeleton />
          ) : (
            <>
              <EditPanelField label="Name" required span="full">
                <Input
                  className="h-8 text-sm"
                  value={draft.name}
                  disabled={!canManageAmp || isSaving}
                  aria-invalid={isNameInvalid || undefined}
                  onChange={(event) => setField('name', event.target.value)}
                />
                {canManageAmp ? (
                  isNameInvalid ? (
                    <p className="text-xs text-destructive">
                      Name cannot be empty.
                    </p>
                  ) : null
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Only administrators can rename a project.
                  </p>
                )}
              </EditPanelField>

              <EditPanelField label="Description" span="full">
                <Textarea
                  className="min-h-20 text-sm"
                  value={draft.description}
                  disabled={isSaving}
                  onChange={(event) =>
                    setField('description', event.target.value)
                  }
                />
              </EditPanelField>

              <EditPanelField label="Release status" span="full">
                <Select
                  value={draft.release_status || undefined}
                  disabled={isSaving || isReleaseStatusLoading}
                  onValueChange={(value) => setField('release_status', value)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="Select release status…" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {releaseStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditPanelField>

              <EditPanelField label="Type" span="full">
                <Select
                  value={draft.group_type || undefined}
                  disabled={isSaving || isGroupTypeLoading}
                  onValueChange={(value) => setField('group_type', value)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {groupTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditPanelField>
            </>
          )}
        </EditPanelSection>

        <EditPanelSection title="Boundary">
          {isLoading ? (
            <FieldsSkeleton />
          ) : (
            <EditPanelField label="Project area" span="full">
              <p className="text-xs text-muted-foreground">
                {draft.project_area
                  ? boundaryFileName
                    ? `Boundary from ${boundaryFileName} (unsaved).`
                    : 'Boundary set.'
                  : 'No boundary set.'}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                className="hidden"
                onChange={(event) =>
                  handleBoundaryFile(event.target.files?.[0])
                }
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="size-3.5" aria-hidden />
                  Upload GeoJSON
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <RouterLink to={`/ocotillo/projects/show/${projectId}`}>
                    <MapIcon className="size-3.5" aria-hidden />
                    Edit on map
                  </RouterLink>
                </Button>

                {draft.project_area ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleRemoveBoundary}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              {boundaryError ? (
                <p className="text-xs text-destructive">{boundaryError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Upload a GeoJSON file containing a single polygon in WGS84.
                </p>
              )}
            </EditPanelField>
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
