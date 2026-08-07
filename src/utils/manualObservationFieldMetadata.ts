import type { IFieldEvent, IFieldActivitySample } from '@/interfaces/ocotillo'

/**
 * Provenance for one manual water-level measurement, gathered from the field
 * event it was recorded under.
 *
 * The groundwater-level observation endpoint returns the reading alone — who
 * took it, how, and under which visit lives on the field-event tree returned
 * by `thing/water-well/{id}/details`. Correcting a hydrograph means judging
 * which manual anchors to trust, so the workbench joins the two.
 */
export interface ManualObservationFieldMetadata {
  collectedBy: string | null
  collectorOrganization: string | null
  measurementMethod: string | null
  fieldEventDate: string | null
  notes: string | null
}

const firstNonEmpty = (
  ...values: (string | null | undefined)[]
): string | null => values.find((value) => value?.trim())?.trim() ?? null

/**
 * Who took the measurement. The sample's own contact is the record of the
 * person who read the tape, so it wins; `sampler_name` is the free-text
 * fallback older records use. Event participants are the last resort — they
 * describe who was on site, not necessarily who took this reading, so a Lead
 * is preferred and the role is not treated as authoritative.
 */
const resolveCollector = (
  sample: IFieldActivitySample,
  event: IFieldEvent
): { name: string | null; organization: string | null } => {
  const direct = firstNonEmpty(sample.contact?.name, sample.sampler_name)
  if (direct) {
    return {
      name: direct,
      organization: firstNonEmpty(sample.contact?.organization),
    }
  }

  const participants = event.field_event_participants ?? []
  const lead =
    participants.find(
      (participant) => participant.participant_role?.toLowerCase() === 'lead'
    ) ?? participants[0]

  return {
    name: firstNonEmpty(lead?.participant?.name),
    organization: firstNonEmpty(lead?.participant?.organization),
  }
}

/**
 * Index the field-event tree by observation id.
 *
 * Callers should include `first_field_event` alongside `field_events` — the
 * API returns the oldest event separately so it cannot be cut off by the
 * field-event page limit, and it anchors the earliest manual measurements.
 */
export const buildManualObservationFieldMetadata = (
  fieldEvents: readonly (IFieldEvent | null | undefined)[]
): Map<number, ManualObservationFieldMetadata> => {
  const byObservationId = new Map<number, ManualObservationFieldMetadata>()

  for (const event of fieldEvents) {
    if (!event) continue

    for (const activity of event.field_activities ?? []) {
      for (const sample of activity.samples ?? []) {
        const collector = resolveCollector(sample, event)
        const metadata: ManualObservationFieldMetadata = {
          collectedBy: collector.name,
          collectorOrganization: collector.organization,
          measurementMethod: firstNonEmpty(sample.sample_method),
          fieldEventDate: firstNonEmpty(event.event_date, sample.sample_date),
          // Narrowest scope first: a sample note describes this reading,
          // where an event note describes the whole visit.
          notes: firstNonEmpty(sample.notes, activity.notes, event.notes),
        }

        for (const observation of sample.observations ?? []) {
          // A later event never overwrites an earlier one for the same
          // observation id — ids are unique, so a collision means duplicated
          // data and the first mapping is as good as any.
          if (!byObservationId.has(observation.id)) {
            byObservationId.set(observation.id, metadata)
          }
        }
      }
    }
  }

  return byObservationId
}

/** "Joseph Beman (NMBGMR)", or just the name when no organization is known. */
export const formatCollector = (
  metadata: ManualObservationFieldMetadata | null | undefined
): string | null => {
  if (!metadata?.collectedBy) return null
  return metadata.collectorOrganization
    ? `${metadata.collectedBy} (${metadata.collectorOrganization})`
    : metadata.collectedBy
}
