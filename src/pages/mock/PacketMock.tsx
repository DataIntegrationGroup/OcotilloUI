import type { IWell } from '@/interfaces/ocotillo'
import { buildFieldSheetPageOneFixture } from '@/mock/fieldSheetPageOne.fixture'
import { buildPacketData } from '@/pages/print/packetData'

/**
 * Mocked data for the Tailwind packet, driven entirely from the frozen field
 * fixture — no Router, no @refinedev hooks, no network call (the gate runs with
 * no API on this box). `?mock=1` builds a single object shaped exactly like the
 * real page's resolved data so PacketPrintPage can render it verbatim.
 */
export function buildPacketMock() {
  const fixture = buildFieldSheetPageOneFixture({ photos: 3 })

  // Newest reading only, for the single prefilled row on page 1 (§3 c).
  const newest = [...fixture.observations]
    .filter((o) => o.observation_datetime && typeof o.depth_to_water_bgs === 'number')
    .sort(
      (a, b) =>
        new Date(b.observation_datetime!).getTime() -
        new Date(a.observation_datetime!).getTime()
    )
    .slice(0, 1)[0]

  const dtw = newest ? Number(newest.depth_to_water_bgs) : null
  const sampleId = (newest as { sample_id?: number }).sample_id ?? null
  const method = sampleId != null ? fixture.sampleMethodsBySampleId[sampleId] ?? '-' : '—'

  return {
    well: fixture.well as IWell,
    locationText: fixture.well.current_location?.properties || null,
    measurementsRow: dtw != null ? {
      date: new Date(newest.observation_datetime!).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric' as const,
      }),
      dtw: `${dtw.toFixed(2)} ft`,
      method,
      levelStatus: (newest as { level_status?: string }).level_status ?? '—',
      siteNotes: '-',
    } : null,
    equipmentRows: fixture.sensorDeployments ?? [],
    observations: fixture.observations,
    ...buildPacketData({ well: fixture.well, observations: fixture.observations }),
  }
}
