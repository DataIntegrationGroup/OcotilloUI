import { useCallback, useState } from 'react'
import {
  EditPanel,
  EditPanelField,
  EditPanelSection,
} from '@/components/editing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FIELD_SPECS,
  type FieldSpec,
  formatCoord,
  validateDraft,
  type WellDraft,
} from './inventoryFields'
import { LocationPickerModal } from './LocationPickerModal'

// FIELD_SPECS grouped into ordered sections for the form.
const SECTIONS: { title: string; specs: FieldSpec[] }[] = (() => {
  const order: string[] = []
  const byGroup = new Map<string, FieldSpec[]>()
  for (const spec of FIELD_SPECS) {
    if (!byGroup.has(spec.group)) {
      byGroup.set(spec.group, [])
      order.push(spec.group)
    }
    byGroup.get(spec.group)!.push(spec)
  }
  return order.map((title) => ({ title, specs: byGroup.get(title)! }))
})()

export interface SubmitResult {
  ok: boolean
  fieldErrors?: Record<string, string>
  message?: string
}

interface WellFormPanelProps {
  title: string
  submitLabel: string
  /** Starting values (a blank draft to create, or an existing row to edit). */
  initial: WellDraft
  /** Persist/apply the draft; return ok or per-field errors. */
  onSubmit: (draft: WellDraft) => Promise<SubmitResult>
  onClose: () => void
}

/**
 * Slide-out well form (built from FIELD_SPECS) used to create a new well or
 * edit an existing grid row. Client-validates, then hands the draft to
 * `onSubmit`; server/field errors surface under the offending inputs. Mount it
 * keyed by the target so it re-initializes from `initial`.
 */
export function WellFormPanel({
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: WellFormPanelProps) {
  const [draft, setDraft] = useState<WellDraft>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const setField = useCallback((id: keyof WellDraft, value: unknown) => {
    setDraft((d) => ({ ...d, [id]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    const clientErrors = validateDraft(draft)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setMessage('Fix the highlighted fields.')
      return
    }
    setSubmitting(true)
    setErrors({})
    setMessage(null)
    const result = await onSubmit(draft)
    if (result.ok) {
      onClose()
      return
    }
    if (result.fieldErrors) setErrors(result.fieldErrors)
    setMessage(result.message ?? 'Could not save.')
    setSubmitting(false)
  }, [draft, onSubmit, onClose])

  return (
    <EditPanel
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : submitLabel}
          </Button>
        </>
      }
    >
      {message && (
        <div className="mb-3 rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </div>
      )}

      {SECTIONS.map((section) => (
        <EditPanelSection key={section.title} title={section.title}>
          {section.specs.map((spec) => (
            <EditPanelField
              key={spec.id}
              label={spec.header}
              required={spec.required}
            >
              <FieldInput spec={spec} draft={draft} setField={setField} />
              {errors[spec.id] && (
                <span className="text-xs text-destructive">
                  {errors[spec.id]}
                </span>
              )}
            </EditPanelField>
          ))}
          {section.title === 'Location' && (
            <EditPanelField label="Map" span="full">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => setPickerOpen(true)}
              >
                📍{' '}
                {draft.latitude != null && draft.longitude != null
                  ? `${formatCoord(draft.latitude)}, ${formatCoord(draft.longitude)}`
                  : 'Pick on map'}
              </Button>
            </EditPanelField>
          )}
        </EditPanelSection>
      ))}

      {pickerOpen && (
        <LocationPickerModal
          lat={draft.latitude ?? null}
          lon={draft.longitude ?? null}
          onConfirm={(lat, lon) => {
            setField('latitude', lat)
            setField('longitude', lon)
            // Map pins are WGS84 — record the datum for the picked coordinates.
            setField('source_datum', 'WGS84')
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </EditPanel>
  )
}

function FieldInput({
  spec,
  draft,
  setField,
}: {
  spec: FieldSpec
  draft: WellDraft
  setField: (id: keyof WellDraft, value: unknown) => void
}) {
  const value = draft[spec.id]

  if (spec.kind === 'boolean') {
    return (
      <div className="pt-1">
        <Checkbox
          checked={value === true}
          onCheckedChange={(c) => setField(spec.id, c === true)}
        />
      </div>
    )
  }

  if (spec.kind === 'dropdown') {
    return (
      <Select
        value={typeof value === 'string' ? value : ''}
        onValueChange={(v) => setField(spec.id, v)}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {(spec.options ?? []).map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (spec.kind === 'number') {
    return (
      <Input
        type="number"
        className="h-8 text-sm"
        value={value == null ? '' : String(value)}
        onChange={(e) =>
          setField(spec.id, e.target.value === '' ? null : Number(e.target.value))
        }
      />
    )
  }

  return (
    <Input
      className="h-8 text-sm"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) =>
        setField(spec.id, e.target.value === '' ? null : e.target.value)
      }
    />
  )
}
