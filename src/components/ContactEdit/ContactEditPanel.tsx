import { useEffect, useMemo, useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import {
  useUpdate,
  useNotification,
  useInvalidate,
  useCustomMutation,
} from '@refinedev/core'
import { Loader2, PlusIcon, Trash2Icon } from 'lucide-react'
import { captureEvent } from '@/analytics/posthog'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactEditPanelProps {
  contactId: string | number
  contact: IContact | undefined
  isLoading?: boolean
  onClose: () => void
}

interface ContactDetailsDraft {
  name: string
  organization: string
  role: string
  contact_type: string
}

interface EmailDraft {
  draftId: string
  id?: number
  email: string
  email_type: string
}

interface PhoneDraft {
  draftId: string
  id?: number
  phone_number: string
  phone_type: string
}

interface AddressDraft {
  draftId: string
  id?: number
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
  address_type: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _draftIdCounter = 0
function generateDraftId() {
  return `draft-${++_draftIdCounter}`
}

function initContactDraft(contact: IContact | undefined): ContactDetailsDraft {
  return {
    name: contact?.name ?? '',
    organization: contact?.organization ?? '',
    role: contact?.role ?? '',
    contact_type: contact?.contact_type ?? '',
  }
}

function initEmailDrafts(contact: IContact | undefined): EmailDraft[] {
  return (contact?.emails ?? []).map((e) => ({
    draftId: generateDraftId(),
    id: e.id,
    email: e.email,
    email_type: e.email_type,
  }))
}

function initPhoneDrafts(contact: IContact | undefined): PhoneDraft[] {
  return (contact?.phones ?? []).map((p) => ({
    draftId: generateDraftId(),
    id: p.id,
    phone_number: e164ToDisplay(p.phone_number),
    phone_type: p.phone_type,
  }))
}

function initAddressDrafts(contact: IContact | undefined): AddressDraft[] {
  return (contact?.addresses ?? []).map((a) => ({
    draftId: generateDraftId(),
    id: a.id,
    address_line_1: a.address_line_1 ?? '',
    address_line_2: a.address_line_2 ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    postal_code: a.postal_code ?? '',
    country: a.country ?? '',
    address_type: a.address_type ?? '',
  }))
}

function contactDraftsEqual(
  a: ContactDetailsDraft,
  b: ContactDetailsDraft
): boolean {
  return (
    a.name === b.name &&
    a.organization === b.organization &&
    a.role === b.role &&
    a.contact_type === b.contact_type
  )
}

function isEmailModified(draft: EmailDraft, initials: EmailDraft[]): boolean {
  if (!draft.id) return false
  const orig = initials.find((i) => i.id === draft.id)
  if (!orig) return false
  return draft.email !== orig.email || draft.email_type !== orig.email_type
}

function isPhoneModified(draft: PhoneDraft, initials: PhoneDraft[]): boolean {
  if (!draft.id) return false
  const orig = initials.find((i) => i.id === draft.id)
  if (!orig) return false
  return draft.phone_number !== orig.phone_number || draft.phone_type !== orig.phone_type
}

// ─── Phone / email helpers ────────────────────────────────────────────────────

function formatPhoneDigits(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return ''
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function e164ToDisplay(e164: string | undefined | null): string {
  if (!e164) return ''
  const digits = e164.replace(/\D/g, '')
  const local =
    digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return formatPhoneDigits(local)
}

function displayToE164(display: string): string {
  const digits = display.replace(/\D/g, '')
  return digits.length === 10 ? `+1${digits}` : display
}

function isValidEmail(email: string): boolean {
  if (!email.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidPhone(display: string): boolean {
  if (!display.trim()) return true
  return display.replace(/\D/g, '').length === 10
}

function isAddressModified(
  draft: AddressDraft,
  initials: AddressDraft[]
): boolean {
  if (!draft.id) return false
  const orig = initials.find((i) => i.id === draft.id)
  if (!orig) return false
  return (
    draft.address_line_1 !== orig.address_line_1 ||
    draft.address_line_2 !== orig.address_line_2 ||
    draft.city !== orig.city ||
    draft.state !== orig.state ||
    draft.postal_code !== orig.postal_code ||
    draft.country !== orig.country ||
    draft.address_type !== orig.address_type
  )
}

// ─── Sub-section row components ───────────────────────────────────────────────

function EmailRow({
  email,
  onChange,
  onDelete,
  disabled,
  typeOptions,
}: {
  email: EmailDraft
  onChange: (updated: EmailDraft) => void
  onDelete: () => void
  disabled: boolean
  typeOptions: { value: string; label: string }[]
}) {
  const [touched, setTouched] = useState(false)
  const invalid = !isValidEmail(email.email)
  const showError = touched && invalid
  const errorId = `email-error-${email.draftId}`

  return (
    <div className="col-span-2 flex flex-col gap-0.5">
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Email address</Label>
          <Input
            type="email"
            value={email.email}
            onChange={(e) => onChange({ ...email, email: e.target.value })}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            className={`h-8 text-sm ${showError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            placeholder="name@example.com"
            aria-invalid={showError}
            aria-describedby={errorId}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={email.email_type}
            onValueChange={(v) => onChange({ ...email, email_type: v })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue placeholder="Type…" />
            </SelectTrigger>
            <SelectContent position="popper">
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label={`Remove email ${email.email}`}
          className="mb-0.5 rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
      <p
        id={errorId}
        role={showError ? 'alert' : undefined}
        aria-live="polite"
        aria-hidden={!showError || undefined}
        className={`min-h-4 text-xs text-destructive ${showError ? 'visible' : 'invisible'}`}
      >
        Enter a valid email address.
      </p>
    </div>
  )
}

function PhoneRow({
  phone,
  onChange,
  onDelete,
  disabled,
  typeOptions,
}: {
  phone: PhoneDraft
  onChange: (updated: PhoneDraft) => void
  onDelete: () => void
  disabled: boolean
  typeOptions: { value: string; label: string }[]
}) {
  const [touched, setTouched] = useState(false)
  const invalid = phone.phone_number.trim() !== '' && !isValidPhone(phone.phone_number)
  const showError = touched && invalid
  const errorId = `phone-error-${phone.draftId}`

  return (
    <div className="col-span-2 flex flex-col gap-0.5">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Code</Label>
          <div className="flex h-8 select-none items-center rounded-md border border-input bg-muted px-2.5 text-sm text-muted-foreground">
            +1
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Phone number</Label>
          <Input
            type="tel"
            value={phone.phone_number}
            onChange={(e) => {
              const formatted = formatPhoneDigits(e.target.value)
              onChange({ ...phone, phone_number: formatted })
            }}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            className={`h-8 text-sm ${showError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            placeholder="(505) 555-0100"
            aria-invalid={showError}
            aria-describedby={errorId}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={phone.phone_type}
            onValueChange={(v) => onChange({ ...phone, phone_type: v })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue placeholder="Type…" />
            </SelectTrigger>
            <SelectContent position="popper">
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label={`Remove phone ${phone.phone_number}`}
          className="mb-0.5 rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
      <p
        id={errorId}
        role={showError ? 'alert' : undefined}
        aria-live="polite"
        aria-hidden={!showError || undefined}
        className={`min-h-4 text-xs text-destructive ${showError ? 'visible' : 'invisible'}`}
      >
        Enter a 10-digit US phone number.
      </p>
    </div>
  )
}

function AddressBlock({
  address,
  onChange,
  onDelete,
  disabled,
  typeOptions,
}: {
  address: AddressDraft
  onChange: (updated: AddressDraft) => void
  onDelete: () => void
  disabled: boolean
  typeOptions: { value: string; label: string }[]
}) {
  return (
    <div className="col-span-2 flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Select
          value={address.address_type}
          onValueChange={(v) => onChange({ ...address, address_type: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue placeholder="Address type…" />
          </SelectTrigger>
          <SelectContent position="popper">
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label={`Remove address ${address.address_line_1}`}
          className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
      <Input
        value={address.address_line_1}
        onChange={(e) => onChange({ ...address, address_line_1: e.target.value })}
        disabled={disabled}
        className="h-8 text-sm"
        placeholder="Address line 1"
        aria-label="Address line 1"
      />
      <Input
        value={address.address_line_2}
        onChange={(e) => onChange({ ...address, address_line_2: e.target.value })}
        disabled={disabled}
        className="h-8 text-sm"
        placeholder="Address line 2 (optional)"
        aria-label="Address line 2"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={address.city}
          onChange={(e) => onChange({ ...address, city: e.target.value })}
          disabled={disabled}
          className="h-8 text-sm"
          placeholder="City"
          aria-label="City"
        />
        <Input
          value={address.state}
          onChange={(e) => onChange({ ...address, state: e.target.value })}
          disabled={disabled}
          className="h-8 text-sm"
          placeholder="State"
          aria-label="State"
        />
        <Input
          value={address.postal_code}
          onChange={(e) => onChange({ ...address, postal_code: e.target.value })}
          disabled={disabled}
          className="h-8 text-sm"
          placeholder="Postal code"
          aria-label="Postal code"
        />
        <Input
          value={address.country}
          onChange={(e) => onChange({ ...address, country: e.target.value })}
          disabled={disabled}
          className="h-8 text-sm"
          placeholder="Country"
          aria-label="Country"
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContactEditPanel({
  contactId,
  contact,
  isLoading = false,
  onClose,
}: ContactEditPanelProps) {
  const { open: notify } = useNotification()
  const invalidate = useInvalidate()
  const { mutateAsync: update } = useUpdate<IContact>()
  const { mutateAsync: mutate } = useCustomMutation()

  const [isSaving, setIsSaving] = useState(false)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const wasLoadingRef = useRef(true)

  // ── Contact details state ──────────────────────────────────────────────────
  const [draft, setDraft] = useState<ContactDetailsDraft>(() =>
    initContactDraft(contact)
  )
  const [initial, setInitial] = useState<ContactDetailsDraft>(() =>
    initContactDraft(contact)
  )

  // ── Sub-resource draft state ───────────────────────────────────────────────
  const [draftEmails, setDraftEmails] = useState<EmailDraft[]>(() =>
    initEmailDrafts(contact)
  )
  const [initialEmails, setInitialEmails] = useState<EmailDraft[]>(() =>
    initEmailDrafts(contact)
  )
  const [deletedEmailIds, setDeletedEmailIds] = useState<Set<number>>(new Set())

  const [draftPhones, setDraftPhones] = useState<PhoneDraft[]>(() =>
    initPhoneDrafts(contact)
  )
  const [initialPhones, setInitialPhones] = useState<PhoneDraft[]>(() =>
    initPhoneDrafts(contact)
  )
  const [deletedPhoneIds, setDeletedPhoneIds] = useState<Set<number>>(new Set())

  const [draftAddresses, setDraftAddresses] = useState<AddressDraft[]>(() =>
    initAddressDrafts(contact)
  )
  const [initialAddresses, setInitialAddresses] = useState<AddressDraft[]>(() =>
    initAddressDrafts(contact)
  )
  const [deletedAddressIds, setDeletedAddressIds] = useState<Set<number>>(
    new Set()
  )

  // ── Lexicon options ────────────────────────────────────────────────────────
  const { options: roleOptions, isLoading: roleLoading } = useLexicon({
    category: 'role',
  })
  const { options: contactTypeOptions, isLoading: contactTypeLoading } =
    useLexicon({ category: 'contact_type' })
  const { options: emailTypeOptions, isLoading: emailTypeLoading } = useLexicon({
    category: 'email_type',
  })
  const { options: phoneTypeOptions, isLoading: phoneTypeLoading } = useLexicon({
    category: 'phone_type',
  })
  const { options: addressTypeOptions, isLoading: addressTypeLoading } =
    useLexicon({ category: 'address_type' })

  const isOptionsLoading =
    roleLoading ||
    contactTypeLoading ||
    emailTypeLoading ||
    phoneTypeLoading ||
    addressTypeLoading

  const panelTitle = contact
    ? `Edit: ${getContactDisplayName(contact)}`
    : 'Edit'

  // ── Sync state when contact loads ─────────────────────────────────────────
  useEffect(() => {
    captureEvent('edit_panel_opened', {
      resource: 'contact',
      contact_id: contactId,
    })
  }, [contactId])

  useEffect(() => {
    wasLoadingRef.current = true
  }, [contactId])

  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true
      return
    }
    if (!wasLoadingRef.current) return

    const syncedContact = initContactDraft(contact)
    setDraft(syncedContact)
    setInitial(syncedContact)

    const syncedEmails = initEmailDrafts(contact)
    setDraftEmails(syncedEmails)
    setInitialEmails(syncedEmails)
    setDeletedEmailIds(new Set())

    const syncedPhones = initPhoneDrafts(contact)
    setDraftPhones(syncedPhones)
    setInitialPhones(syncedPhones)
    setDeletedPhoneIds(new Set())

    const syncedAddresses = initAddressDrafts(contact)
    setDraftAddresses(syncedAddresses)
    setInitialAddresses(syncedAddresses)
    setDeletedAddressIds(new Set())

    wasLoadingRef.current = false
  }, [contact, isLoading, contactId])

  // ── isDirty ───────────────────────────────────────────────────────────────
  const hasValidationErrors = useMemo(() => {
    if (draftEmails.some((e) => !isValidEmail(e.email))) return true
    if (draftPhones.some((p) => p.phone_number.trim() !== '' && !isValidPhone(p.phone_number))) return true
    return false
  }, [draftEmails, draftPhones])

  const isDirty = useMemo(() => {
    if (!contactDraftsEqual(draft, initial)) return true
    if (deletedEmailIds.size > 0) return true
    if (deletedPhoneIds.size > 0) return true
    if (deletedAddressIds.size > 0) return true
    if (draftEmails.some((e) => (!e.id && e.email.trim() !== '') || (e.id != null && isEmailModified(e, initialEmails))))
      return true
    if (draftPhones.some((p) => (!p.id && p.phone_number.trim() !== '') || (p.id != null && isPhoneModified(p, initialPhones))))
      return true
    if (draftAddresses.some((a) => (!a.id && a.address_line_1.trim() !== '') || (a.id != null && isAddressModified(a, initialAddresses))))
      return true
    return false
  }, [
    draft,
    initial,
    draftEmails,
    initialEmails,
    deletedEmailIds,
    draftPhones,
    initialPhones,
    deletedPhoneIds,
    draftAddresses,
    initialAddresses,
    deletedAddressIds,
  ])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDeleteEmail = (email: EmailDraft) => {
    setDraftEmails((prev) => prev.filter((e) => e.draftId !== email.draftId))
    if (email.id != null) {
      setDeletedEmailIds((prev) => new Set([...prev, email.id!]))
    }
  }

  const handleDeletePhone = (phone: PhoneDraft) => {
    setDraftPhones((prev) => prev.filter((p) => p.draftId !== phone.draftId))
    if (phone.id != null) {
      setDeletedPhoneIds((prev) => new Set([...prev, phone.id!]))
    }
  }

  const handleDeleteAddress = (address: AddressDraft) => {
    setDraftAddresses((prev) =>
      prev.filter((a) => a.draftId !== address.draftId)
    )
    if (address.id != null) {
      setDeletedAddressIds((prev) => new Set([...prev, address.id!]))
    }
  }

  const handleSave = async () => {
    if (!isDirty || isSaving) return

    const invalidEmails = draftEmails.filter((e) => !isValidEmail(e.email))
    if (invalidEmails.length > 0) {
      notify?.({
        type: 'error',
        message: 'Fix the invalid email addresses before saving.',
      })
      return
    }

    const invalidPhones = draftPhones.filter(
      (p) => p.phone_number.trim() !== '' && !isValidPhone(p.phone_number)
    )
    if (invalidPhones.length > 0) {
      notify?.({
        type: 'error',
        message: 'Phone numbers must be 10 digits.',
      })
      return
    }

    setIsSaving(true)

    try {
      const ops: Promise<unknown>[] = []
      const changedSections: string[] = []

      // ── Contact details ──────────────────────────────────────────────────
      if (!contactDraftsEqual(draft, initial)) {
        const changes: Record<string, string | undefined> = {}
        if (draft.name !== initial.name) changes.name = draft.name || undefined
        if (draft.organization !== initial.organization)
          changes.organization = draft.organization || undefined
        if (draft.role !== initial.role) changes.role = draft.role || undefined
        if (draft.contact_type !== initial.contact_type)
          changes.contact_type = draft.contact_type || undefined

        ops.push(
          update({
            resource: 'contact',
            dataProviderName: 'ocotillo',
            id: contactId,
            values: changes,
            successNotification: false,
          })
        )
        changedSections.push('contact_details')
      }

      // ── Emails ───────────────────────────────────────────────────────────
      if (
        deletedEmailIds.size > 0 ||
        draftEmails.some((e) => !e.id || isEmailModified(e, initialEmails))
      ) {
        changedSections.push('emails')
      }

      for (const id of deletedEmailIds) {
        ops.push(
          mutate({
            url: `contact/email/${id}`,
            method: 'delete',
            values: {},
            dataProviderName: 'ocotillo',
          })
        )
      }

      for (const email of draftEmails) {
        if (email.id == null && email.email.trim()) {
          ops.push(
            mutate({
              url: 'contact/email',
              method: 'post',
              values: {
                contact_id: Number(contactId),
                email: email.email,
                email_type: email.email_type,
              },
              dataProviderName: 'ocotillo',
            })
          )
        } else if (email.id != null && isEmailModified(email, initialEmails)) {
          ops.push(
            mutate({
              url: `contact/email/${email.id}`,
              method: 'patch',
              values: { email: email.email, email_type: email.email_type },
              dataProviderName: 'ocotillo',
            })
          )
        }
      }

      // ── Phones ───────────────────────────────────────────────────────────
      if (
        deletedPhoneIds.size > 0 ||
        draftPhones.some((p) => !p.id || isPhoneModified(p, initialPhones))
      ) {
        changedSections.push('phones')
      }

      for (const id of deletedPhoneIds) {
        ops.push(
          mutate({
            url: `contact/phone/${id}`,
            method: 'delete',
            values: {},
            dataProviderName: 'ocotillo',
          })
        )
      }

      for (const phone of draftPhones) {
        if (phone.id == null && phone.phone_number.trim()) {
          ops.push(
            mutate({
              url: 'contact/phone',
              method: 'post',
              values: {
                contact_id: Number(contactId),
                phone_number: displayToE164(phone.phone_number),
                phone_type: phone.phone_type,
              },
              dataProviderName: 'ocotillo',
            })
          )
        } else if (
          phone.id != null &&
          isPhoneModified(phone, initialPhones)
        ) {
          ops.push(
            mutate({
              url: `contact/phone/${phone.id}`,
              method: 'patch',
              values: {
                phone_number: displayToE164(phone.phone_number),
                phone_type: phone.phone_type,
              },
              dataProviderName: 'ocotillo',
            })
          )
        }
      }

      // ── Addresses ────────────────────────────────────────────────────────
      if (
        deletedAddressIds.size > 0 ||
        draftAddresses.some((a) => !a.id || isAddressModified(a, initialAddresses))
      ) {
        changedSections.push('addresses')
      }

      for (const id of deletedAddressIds) {
        ops.push(
          mutate({
            url: `contact/address/${id}`,
            method: 'delete',
            values: {},
            dataProviderName: 'ocotillo',
          })
        )
      }

      for (const address of draftAddresses) {
        if (address.id == null && address.address_line_1.trim()) {
          ops.push(
            mutate({
              url: 'contact/address',
              method: 'post',
              values: {
                contact_id: Number(contactId),
                address_line_1: address.address_line_1,
                address_line_2: address.address_line_2 || undefined,
                city: address.city || undefined,
                state: address.state || undefined,
                postal_code: address.postal_code || undefined,
                country: address.country || undefined,
                address_type: address.address_type,
              },
              dataProviderName: 'ocotillo',
            })
          )
        } else if (
          address.id != null &&
          isAddressModified(address, initialAddresses)
        ) {
          ops.push(
            mutate({
              url: `contact/address/${address.id}`,
              method: 'patch',
              values: {
                address_line_1: address.address_line_1,
                address_line_2: address.address_line_2 || undefined,
                city: address.city || undefined,
                state: address.state || undefined,
                postal_code: address.postal_code || undefined,
                country: address.country || undefined,
                address_type: address.address_type,
              },
              dataProviderName: 'ocotillo',
            })
          )
        }
      }

      await Promise.all(ops)
      await invalidate({
        resource: 'contact',
        dataProviderName: 'ocotillo',
        id: contactId,
        invalidates: ['detail', 'list'],
      })

      captureEvent('edit_saved', {
        resource: 'contact',
        contact_id: contactId,
        fields_changed: changedSections,
      })
      onClose()
    } catch {
      notify?.({
        type: 'error',
        message: 'Could not save changes. Please try again.',
      })
    } finally {
      setIsSaving(false)
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
    captureEvent('edit_abandoned', {
      resource: 'contact',
      contact_id: contactId,
      had_changes: isDirty,
    })
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
              disabled={!isDirty || isSaving || hasValidationErrors}
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
        {/* Contact Details */}
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
              <EditPanelField label="Contact Type">
                {isOptionsLoading ? (
                  <Skeleton className="h-8 w-full rounded-md" />
                ) : (
                  <Select
                    value={draft.contact_type}
                    onValueChange={(v) =>
                      setDraft((prev) => ({ ...prev, contact_type: v }))
                    }
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
              <EditPanelField label="Role">
                {isOptionsLoading ? (
                  <Skeleton className="h-8 w-full rounded-md" />
                ) : (
                  <Select
                    value={draft.role}
                    onValueChange={(v) =>
                      setDraft((prev) => ({ ...prev, role: v }))
                    }
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
              <EditPanelField label="Name" span="full">
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={isSaving}
                  className="h-8 text-sm"
                  placeholder="Contact name"
                />
              </EditPanelField>
              <EditPanelField label="Organization" span="full">
                <Input
                  value={draft.organization}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      organization: e.target.value,
                    }))
                  }
                  disabled={isSaving}
                  className="h-8 text-sm"
                  placeholder="Organization or Company"
                />
              </EditPanelField>
            </>
          )}
        </EditPanelSection>

        {/* Phones */}
        <EditPanelSection title="Phone Numbers" defaultOpen={false}>
          {draftPhones.map((phone) => (
            <PhoneRow
              key={phone.draftId}
              phone={phone}
              onChange={(updated) =>
                setDraftPhones((prev) =>
                  prev.map((p) => (p.draftId === updated.draftId ? updated : p))
                )
              }
              onDelete={() => handleDeletePhone(phone)}
              disabled={isSaving}
              typeOptions={phoneTypeOptions}
            />
          ))}
          <div className="col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setDraftPhones((prev) => [
                  ...prev,
                  {
                    draftId: generateDraftId(),
                    phone_number: '',
                    phone_type: phoneTypeOptions[0]?.value ?? 'Primary',
                  },
                ])
              }
              disabled={isSaving}
              className="w-full"
            >
              <PlusIcon className="size-4" />
              Add phone
            </Button>
          </div>
        </EditPanelSection>

        {/* Emails */}
        <EditPanelSection title="Email Addresses" defaultOpen={false}>
          {draftEmails.map((email) => (
            <EmailRow
              key={email.draftId}
              email={email}
              onChange={(updated) =>
                setDraftEmails((prev) =>
                  prev.map((e) => (e.draftId === updated.draftId ? updated : e))
                )
              }
              onDelete={() => handleDeleteEmail(email)}
              disabled={isSaving}
              typeOptions={emailTypeOptions}
            />
          ))}
          <div className="col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setDraftEmails((prev) => [
                  ...prev,
                  {
                    draftId: generateDraftId(),
                    email: '',
                    email_type: emailTypeOptions[0]?.value ?? 'Primary',
                  },
                ])
              }
              disabled={isSaving}
              className="w-full"
            >
              <PlusIcon className="size-4" />
              Add email
            </Button>
          </div>
        </EditPanelSection>

        {/* Addresses */}
        <EditPanelSection title="Addresses" defaultOpen={false}>
          {draftAddresses.map((address) => (
            <AddressBlock
              key={address.draftId}
              address={address}
              onChange={(updated) =>
                setDraftAddresses((prev) =>
                  prev.map((a) =>
                    a.draftId === updated.draftId ? updated : a
                  )
                )
              }
              onDelete={() => handleDeleteAddress(address)}
              disabled={isSaving}
              typeOptions={addressTypeOptions}
            />
          ))}
          <div className="col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setDraftAddresses((prev) => [
                  ...prev,
                  {
                    draftId: generateDraftId(),
                    address_line_1: '',
                    address_line_2: '',
                    city: '',
                    state: 'NM',
                    postal_code: '',
                    country: 'United States',
                    address_type: addressTypeOptions[0]?.value ?? 'Mailing',
                  },
                ])
              }
              disabled={isSaving}
              className="w-full"
            >
              <PlusIcon className="size-4" />
              Add address
            </Button>
          </div>
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
