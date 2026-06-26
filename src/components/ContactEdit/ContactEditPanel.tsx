import { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdate, useNotification, useInvalidate } from '@refinedev/core'
import { Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  EditPanel,
  EditPanelField,
  EditPanelSection,
} from '@/components/editing'
import { useLexicon } from '@/hooks'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import type { IContact } from '@/interfaces/ocotillo'

interface ContactEditPanelProps {
  contactId: string | number
  contact: IContact | undefined
  isLoading?: boolean
  onClose: () => void
}

interface DraftContact {
  name: string
  organization: string
  role: string
  contact_type: string
}

function draftFromContact(contact: IContact | undefined): DraftContact {
  return {
    name: contact?.name ?? '',
    organization: contact?.organization ?? '',
    role: contact?.role ?? '',
    contact_type: contact?.contact_type ?? '',
  }
}

function draftsAreEqual(a: DraftContact, b: DraftContact): boolean {
  return (
    a.name === b.name &&
    a.organization === b.organization &&
    a.role === b.role &&
    a.contact_type === b.contact_type
  )
}

export function ContactEditPanel({
  contactId,
  contact,
  isLoading = false,
  onClose,
}: ContactEditPanelProps) {
  const { open: notify } = useNotification()
  const invalidate = useInvalidate()
  const { mutateAsync: update, mutation } = useUpdate<IContact>()
  const isSaving = mutation.isPending

  const [draft, setDraft] = useState<DraftContact>(() =>
    draftFromContact(contact)
  )
  const [initial, setInitial] = useState<DraftContact>(() =>
    draftFromContact(contact)
  )
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const wasLoadingRef = useRef(true)

  const panelTitle = contact
    ? `Edit: ${getContactDisplayName(contact)}`
    : 'Edit'

  const { options: roleOptions, isLoading: roleLoading } = useLexicon({
    category: 'role',
  })
  const { options: contactTypeOptions, isLoading: contactTypeLoading } =
    useLexicon({ category: 'contact_type' })
  const isOptionsLoading = roleLoading || contactTypeLoading

  useEffect(() => {
    wasLoadingRef.current = true
  }, [contactId])

  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true
      return
    }

    if (!wasLoadingRef.current) return

    const synced = draftFromContact(contact)
    setDraft(synced)
    setInitial(synced)
    wasLoadingRef.current = false
  }, [contact, isLoading, contactId])

  const isDirty = useMemo(
    () => !draftsAreEqual(draft, initial),
    [draft, initial]
  )

  const setField = <K extends keyof DraftContact>(
    key: K,
    value: DraftContact[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!isDirty || isSaving) return

    const changes: Record<string, string | undefined> = {}
    if (draft.name !== initial.name) changes.name = draft.name || undefined
    if (draft.organization !== initial.organization)
      changes.organization = draft.organization || undefined
    if (draft.role !== initial.role) changes.role = draft.role || undefined
    if (draft.contact_type !== initial.contact_type)
      changes.contact_type = draft.contact_type || undefined

    try {
      await update({
        resource: 'contact',
        dataProviderName: 'ocotillo',
        id: contactId,
        values: changes,
        successNotification: false,
      })
      await invalidate({
        resource: 'contact',
        dataProviderName: 'ocotillo',
        id: contactId,
        invalidates: ['detail', 'list'],
      })
      onClose()
    } catch {
      notify?.({
        type: 'error',
        message: 'Could not save contact changes. Please try again.',
      })
    }
  }

  const handleRequestClose = () => {
    if (isSaving) return
    if (isDirty) {
      setDiscardDialogOpen(true)
      return
    }
    onClose()
  }

  const handleDiscardChanges = () => {
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
              disabled={!isDirty || isSaving}
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
        <EditPanelSection title="Contact Details">
          {isLoading ? (
            <>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </>
          ) : (
            <>
              <EditPanelField label="Name" span="full">
                <Input
                  value={draft.name}
                  onChange={(e) => setField('name', e.target.value)}
                  disabled={isSaving}
                  className="h-8 text-sm"
                  placeholder="Contact name"
                />
              </EditPanelField>
              <EditPanelField label="Organization" span="full">
                <Input
                  value={draft.organization}
                  onChange={(e) => setField('organization', e.target.value)}
                  disabled={isSaving}
                  className="h-8 text-sm"
                  placeholder="Organization"
                />
              </EditPanelField>
              <EditPanelField label="Role">
                {isOptionsLoading ? (
                  <Skeleton className="h-8 w-full rounded-md" />
                ) : (
                  <Select
                    value={draft.role}
                    onValueChange={(v) => setField('role', v)}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="h-8 w-full text-sm">
                      <SelectValue placeholder="Select role…" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {roleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </EditPanelField>
              <EditPanelField label="Contact Type">
                {isOptionsLoading ? (
                  <Skeleton className="h-8 w-full rounded-md" />
                ) : (
                  <Select
                    value={draft.contact_type}
                    onValueChange={(v) => setField('contact_type', v)}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="h-8 w-full text-sm">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {contactTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
              Changes you have not saved will be lost.
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
