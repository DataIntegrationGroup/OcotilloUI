/**
 * One well's field sheet inside the batch-export document.
 *
 * Owns the `standalone={false}` mapping so the shared
 * FieldCompilationNotesPdf stops accreting batch-only props. Stand-in for a
 * dedicated batch renderer: delete or merge this file once the batch output
 * is settled with the team.
 */
import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
import type { WellBundle } from '@/interfaces/ocotillo'

export const BatchWellSheet = ({
  bundle,
  hydrographImage,
  mapsQrDataUrl,
  includeOwnerPage = false,
  includeConfidentialContacts = true,
}: {
  bundle: WellBundle
  /** Pre-rendered hydrograph PNG; null/undefined prints "Hydrograph unavailable". */
  hydrographImage?: string | null
  /** Page-1 Google Maps QR for this well; null/undefined leaves the slot empty. */
  mapsQrDataUrl?: string | null
  /** Page 2 (owner leave-behind); off for batch embeds by default. */
  includeOwnerPage?: boolean
  includeConfidentialContacts?: boolean
}) => (
  <FieldCompilationNotesPdf
    well={bundle.well}
    contacts={bundle.contacts}
    assets={bundle.assets}
    observations={bundle.observations}
    sensorDeployments={bundle.sensorDeployments}
    hydrographImage={hydrographImage ?? null}
    sampleMethodsBySampleId={bundle.sampleMethodsBySampleId}
    staffBySampleId={bundle.staffBySampleId}
    yearSpan={bundle.yearSpan}
    mapsQrDataUrl={mapsQrDataUrl ?? null}
    standalone={false}
    includeOwnerPage={includeOwnerPage}
    includeConfidentialContacts={includeConfidentialContacts}
  />
)
