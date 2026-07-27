import { useCallback, useState } from 'react'
import { useDataProvider } from '@refinedev/core'
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
  cleanDraft,
  formatCoord,
  validateDraft,
  type WellDraft,
} from './inventoryFields'
import { flattenFieldErrors } from './recordsGridLogic'
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

interface CreateWellPanelProps {
  onClose: () => void
  /** Called after a well is successfully created. */
  onCreated: () => void
}

/**
 * Single-well entry form for the geothermal inventory — a slide-out panel
 * (modeled on the Data Grid example's Create Well panel) built from FIELD_SPECS.
 * Client-validates, then POSTs one well through the geothermal provider; server
 * field errors surface under the offending inputs. (No bulk add here — the grid
 * covers batch entry.)
 */
export function CreateWellPanel({ onClose, onCreated }: CreateWellPanelProps) {
  const dataProvider = useDataProvider()
  const [draft, setDraft] = useState<WellDraft>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const setField = useCallback((id: keyof WellDraft, value: unknown) => {
    setDraft((d) => ({ ...d, [id]: value }))
  }, [])

  const handleCreate = useCallback(async () => {
    const clientErrors = validateDraft(draft)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setMessage('Fix the highlighted fields.')
      return
    }
    setSubmitting(true)
    setErrors({})
    setMessage(null)
    try {
      await dataProvider('geothermal').create({
        resource: 'thing/geothermal-well',
        variables: cleanDraft(draft),
      })
      onCreated()
    } catch (reason) {
      const fe = flattenFieldErrors(
        (reason as { fieldErrors?: unknown })?.fieldErrors
      )
      if (fe) {
        setErrors(fe)
        setMessage('The server rejected some fields.')
      } else {
        setMessage('Could not create the well (create endpoint unavailable).')
      }
    } finally {
      setSubmitting(false)
    }
  }, [draft, dataProvider, onCreated])

  return (
    <EditPanel
      title="Create Well"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Well'}
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
      onChange={(e) => setField(spec.id, e.target.value === '' ? null : e.target.value)}
    />
  )
}
