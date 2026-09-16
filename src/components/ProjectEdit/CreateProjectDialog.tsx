import { useCreate, useNotification } from '@refinedev/core'
import { Loader2, UploadIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { captureEvent } from '@/analytics/posthog'
import { EditPanelField } from '@/components/editing'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useLexicon } from '@/hooks'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'
import { parseProjectBoundaryGeoJson } from '@/utils'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (project: IGroup) => void
}

/**
 * Fields sent to POST /group. group_type is accepted by the API
 * (OcotilloAPI#947) ahead of the CreateGroup schema in openapi-auth.json.
 */
type ProjectDraft = {
  name: string
  description: string
  release_status: string
  group_type: string
  /** WKT, the shape the API stores in group.project_area. */
  project_area: string
}

/** New projects are public unless the creator picks otherwise. */
const EMPTY_DRAFT: ProjectDraft = {
  name: '',
  description: '',
  release_status: 'public',
  group_type: '',
  project_area: '',
}

const MAX_BOUNDARY_FILE_BYTES = 10 * 1024 * 1024

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const { open: notify } = useNotification()
  const { mutateAsync: createProject, mutation } = useCreate<IGroup>()
  const { options: releaseStatusOptions, isLoading: isReleaseStatusLoading } =
    useLexicon({ category: 'release_status' })
  const { options: groupTypeOptions, isLoading: isGroupTypeLoading } =
    useLexicon({ category: 'group_type' })

  const [draft, setDraft] = useState<ProjectDraft>(EMPTY_DRAFT)
  const [nameTouched, setNameTouched] = useState(false)
  const [boundaryError, setBoundaryError] = useState<string | null>(null)
  const [boundaryFileName, setBoundaryFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSaving = mutation.isPending
  const isNameInvalid = draft.name.trim().length === 0

  // Start every open from a blank form.
  useEffect(() => {
    if (!open) return
    setDraft(EMPTY_DRAFT)
    setNameTouched(false)
    setBoundaryError(null)
    setBoundaryFileName(null)
    captureEvent('create_dialog_opened', { resource: 'project' })
  }, [open])

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
  }

  const handleRemoveBoundary = () => {
    setBoundaryError(null)
    setBoundaryFileName(null)
    setField('project_area', '')
  }

  const handleOpenChange = (next: boolean) => {
    if (isSaving) return
    onOpenChange(next)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setNameTouched(true)
    if (isSaving || isNameInvalid) return

    const description = draft.description.trim()
    const values = {
      name: draft.name.trim(),
      description: description === '' ? null : description,
      release_status: draft.release_status || EMPTY_DRAFT.release_status,
      group_type: draft.group_type === '' ? null : draft.group_type,
      project_area: draft.project_area === '' ? null : draft.project_area,
    }

    try {
      const response = await createProject({
        resource: 'group',
        dataProviderName: 'ocotillo',
        values,
        successNotification: false,
      })

      captureEvent('create_saved', {
        resource: 'project',
        project_id: response.data?.id,
        group_type: values.group_type,
        has_boundary: values.project_area !== null,
      })
      notify?.({
        type: 'success',
        message: `Created project ${values.name}.`,
      })
      onOpenChange(false)
      if (response.data) onCreated?.(response.data)
    } catch (error) {
      // group has a unique (name, group_type) constraint.
      const status = (error as { statusCode?: number })?.statusCode
      notify?.({
        type: 'error',
        message:
          status === 409
            ? 'Another project already uses this name and type.'
            : 'Could not create the project. Please try again.',
      })
    }
  }

  const showNameError = nameTouched && isNameInvalid

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Add a project. Wells can be assigned to it afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <EditPanelField label="Name" required span="full">
              <Input
                className="h-8 text-sm"
                value={draft.name}
                disabled={isSaving}
                autoFocus
                aria-label="Name"
                aria-invalid={showNameError || undefined}
                onChange={(event) => {
                  // Not onBlur: the dialog's focus handling blurs on open.
                  setNameTouched(true)
                  setField('name', event.target.value)
                }}
              />
              {showNameError ? (
                <p className="text-xs text-destructive">
                  Name cannot be empty.
                </p>
              ) : null}
            </EditPanelField>

            <EditPanelField label="Description" span="full">
              <Textarea
                className="min-h-20 text-sm"
                value={draft.description}
                disabled={isSaving}
                aria-label="Description"
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
                <SelectTrigger
                  className="h-8 w-full text-sm"
                  aria-label="Release status"
                >
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
                <SelectTrigger className="h-8 w-full text-sm" aria-label="Type">
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

            <EditPanelField label="Boundary" span="full">
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                className="hidden"
                data-testid="boundary-file-input"
                onChange={(event) =>
                  handleBoundaryFile(event.target.files?.[0])
                }
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="size-3.5" aria-hidden />
                  Upload GeoJSON
                </Button>

                {draft.project_area ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleRemoveBoundary}
                  >
                    Remove
                  </Button>
                ) : null}

                {boundaryFileName ? (
                  <span className="text-xs text-muted-foreground">
                    {boundaryFileName}
                  </span>
                ) : null}
              </div>

              {boundaryError ? (
                <p className="text-xs text-destructive">{boundaryError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Optional. A GeoJSON file containing a single polygon in WGS84.
                </p>
              )}
            </EditPanelField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                'Create project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
