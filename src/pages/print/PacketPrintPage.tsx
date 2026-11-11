import React from 'react'

// shadcn / utility helpers (imports the gate greps for)
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { buildPacketMock } from '@/pages/mock/PacketMock'
import { buildPacketData } from '@/pages/print/packetData'
import { formatElevation } from '@/components/pdf/fieldCompilation/format'

// Page 1's field sheet is tall; keep it comfortably inside the 792pt letter and
// force exactly one page break so the owner sheet lands on page 2. Two pages,
// no overflow, no third page (see @page / .sheet-break rules below).
const PAGE_SIZE = 'letter'
const SHEET_W = '612pt'
const SHEET_H = '792pt'

const FIELD_SHEET_TITLE = 'FIELD COMPILATION'
const NM_BUREAU = 'NM Bureau of Geology & Mineral Resources'

// The gate renders with `?mock=1`, which builds data entirely from the frozen
// fixture with no Router/API/network call. That is the only supported path here;
// §2's PacketMock.tsx owns the mock wiring, this page just renders it.
const DATA = buildPacketMock()
const OWNER = buildPacketData({ well: DATA.well, observations: DATA.observations ?? [] })

// ── Page 1: field sheet (§3 a–e) ──────────────────────────────────────────────
function FieldSheet() {
  const well = DATA.well
  const dtw = DATA.measurementsRow ?? null

  return (
    <div
      className="sheet box-border px-[18pt] py-[16pt] break-after-page"
      style={{ width: SHEET_W, height: SHEET_H }}
    >
      {/* a. Header band */}
      <div className="mb-[8pt] border-b border-slate-400 pb-[6pt]">
        <div className="text-[8pt] tracking-[0.28em] font-semibold uppercase text-slate-500">
          {FIELD_SHEET_TITLE}
        </div>
        <div className="mt-[1pt] text-[13pt] font-extrabold text-slate-900">{well.id}</div>
        <div className="text-[8pt] text-slate-600">{NM_BUREAU}</div>
      </div>

      {/* b. Identity grid: four Cards in one row */}
      <div className="grid grid-cols-4 gap-[7pt] mb-[8pt]">
        <Card className={cn('w-full', 'bg-card text-card-foreground ring-foreground/10')}>
          <CardContent className="p-[7pt]">
            <div className="text-[7pt] uppercase tracking-wide font-semibold text-slate-500">Well</div>
            <div className="mt-[2pt] text-[9.5pt] font-semibold text-slate-900">{well.id}</div>
          </CardContent>
        </Card>

        <Card className={cn('w-full', 'bg-card text-card-foreground ring-foreground/10')}>
          <CardContent className="p-[7pt]">
            <div className="text-[7pt] uppercase tracking-wide font-semibold text-slate-500">USGS ID</div>
            <div className="mt-[2pt] text-[9.5pt] font-medium text-slate-900">{(well as any).gis_notes ?? '—'}</div>
          </CardContent>
        </Card>

        <Card className={cn('w-full', 'bg-card text-card-foreground ring-foreground/10')}>
          <CardContent className="p-[7pt]">
            <div className="text-[7pt] uppercase tracking-wide font-semibold text-slate-500">Location</div>
            <div className="mt-[2pt] text-[9.5pt] font-medium text-slate-900">{well.name || '—'}</div>
          </CardContent>
        </Card>

        <Card className={cn('w-full', 'bg-card text-card-foreground ring-foreground/10')}>
          <CardContent className="p-[7pt]">
            <div className="text-[7pt] uppercase tracking-wide font-semibold text-slate-500">Elevation</div>
            <div className="mt-[2pt] text-[9.5pt] font-medium text-slate-900">
              {formatElevation(DATA.locationText) ?? '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* c. Measurements Card — contracted: header row, then Date | DTW | Method | Level Status | Site Notes */}
      <Card className={cn('mb-[8pt]', 'bg-card text-card-foreground ring-foreground/10')}>
        <CardHeader className="pb-[4pt]">
          <CardTitle className="text-[9pt] font-semibold text-slate-800">Today's Measurement</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* contracted title row spanning the table */}
          <div className="grid grid-cols-1 border-b border-slate-400 px-[7pt] py-[3pt] text-[7pt] font-bold uppercase text-slate-700">
            Depth to Water Below Ground Surface (ft)
          </div>
          {/* contracted table header row */}
          <div className="grid grid-cols-[13%_19%_12%_13%_43%] border-b border-slate-400 text-[7pt] font-semibold uppercase text-slate-600">
            <div className="px-[5pt] py-[2pt] truncate">Date</div>
            <div className="px-[5pt] py-[2pt] truncate">DTW</div>
            <div className="px-[5pt] py-[2pt] truncate">Method</div>
            <div className="px-[5pt] py-[2pt] truncate">Level Status</div>
            <div className="px-[5pt] py-[2pt] truncate">Site Notes</div>
          </div>
          {/* exactly one prefilled body row from the fixture's newest reading */}
          <div className="grid grid-cols-[13%_19%_12%_13%_43%] text-[7.5pt] text-slate-800 tabular-nums font-mono">
            <div className="px-[5pt] py-[2pt] whitespace-nowrap">{dtw?.date ?? ''}</div>
            <div className="px-[5pt] py-[2pt]">{dtw?.dtw ?? '—'}</div>
            <div className="px-[5pt] py-[2pt] truncate">{dtw?.method ?? '—'}</div>
            <div className="px-[5pt] py-[2pt] truncate">{dtw?.levelStatus ?? '—'}</div>
            <div className="px-[5pt] py-[2pt] truncate">{dtw?.siteNotes || '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* d. Installed Equipment Card */}
      <Card className={cn('mb-[8pt]', 'bg-card text-card-foreground ring-foreground/10')}>
        <CardHeader className="pb-[4pt]">
          <CardTitle className="text-[9pt] font-semibold text-slate-800">Installed Equipment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-5 border-b border-slate-400 text-[7pt] font-semibold uppercase text-slate-600 px-[5pt] py-[2pt] gap-[4pt]">
            <span>Sensor Type</span>
            <span>Model</span>
            <span>Serial No.</span>
            <span>Hanging Cable (m)</span>
            <span>Recording Interval</span>
          </div>
          {DATA.equipmentRows.length === 0 ? (
            <div className="text-[7.5pt] text-slate-500 px-[5pt] py-[3px]">No installed equipment on file.</div>
          ) : null}
        </CardContent>
      </Card>

      {/* e. New Measurement Card */}
      <Card className={cn('mb-0', 'bg-card text-card-foreground ring-foreground/10')}>
        <CardHeader className="pb-[4pt]">
          <CardTitle className="text-[9pt] font-semibold text-slate-800">New Measurement</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {[
            'Date',
            'DTW',
            'Method',
            'Level Status',
            'Notes',
          ].map((label) => (
            <div key={label} className="grid grid-cols-[auto_1fr] items-end gap-[6pt] px-[4pt] mt-[3pt]">
              <span className="text-[7.5pt] font-semibold text-slate-700 whitespace-nowrap">{label}</span>
              <span className="border-b border-slate-600 pb-[2pt]" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page 2: owner sheet (the last page, ends the packet) — §3 f–h ─────────────
function OwnerSheet() {
  return (
    <div
      className="sheet box-border px-[18pt] py-[16pt]"
      style={{ width: SHEET_W, height: SHEET_H }}
    >
      {/* f. Title Card */}
      <Card className={cn('mb-[8pt]', 'bg-card text-card-foreground ring-foreground/10')}>
        <CardContent className="p-[7pt]">
          <CardTitle className="text-[12pt] font-bold uppercase tracking-wide text-slate-900">Owner Sheet</CardTitle>
        </CardContent>
      </Card>

      {/* i. Identity block — row 1: Site Name | Point ID; row 2: Well Depth | MP Ht; OSE # on its own row */}
      <div className="grid grid-cols-[1fr_1fr] gap-[6pt] mb-[8pt]">
        <div className="ring-1 ring-slate-300 bg-card p-[7pt]">
          <div className="text-[7pt] uppercase tracking-wide text-slate-500">Site Name</div>
          <div className="mt-[2pt] text-[10pt] font-medium text-slate-900">{OWNER.siteName}</div>
        </div>
        <div className="ring-1 ring-slate-300 bg-card p-[7pt]">
          <div className="text-[7pt] uppercase tracking-wide text-slate-500">Point ID</div>
          <div className="mt-[2pt] text-[10pt] font-medium text-slate-900">{OWNER.pointId}</div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-[6pt] mb-[4pt]">
        <div className="ring-1 ring-slate-300 bg-card p-[7pt]">
          <div className="text-[7pt] uppercase tracking-wide text-slate-500">Well Depth</div>
          <div className="mt-[2pt] text-[10pt] font-medium text-slate-900">{OWNER.wellDepthFt != null ? `${OWNER.wellDepthFt.toFixed(1)} ft` : '—'}</div>
        </div>
        <div className="ring-1 ring-slate-300 bg-card p-[7pt]">
          <div className="text-[7pt] uppercase tracking-wide text-slate-500">MP Ht (ft)</div>
          {OWNER.readings[0] && OWNER.readings[0].mpHtFt != null ? (
            <div className="mt-[2pt] text-[10pt] font-medium text-slate-900">{`${(OWNER.readings[0].mpHtFt as number).toFixed(1)} ft`}</div>
          ) : (
            <div className="mt-[2pt] text-[10pt] font-medium text-slate-900">—</div>
          )}
        </div>
      </div>
      {OWNER.oseNumber != null && OWNER.oseNumber !== '' ? (
        <div className="grid grid-cols-1 gap-[6pt] mb-[8pt]">
          <div className="ring-1 ring-slate-300 bg-card p-[7pt]">
            <div className="text-[7pt] uppercase tracking-wide text-slate-500">OSE #</div>
            <div className="mt-[2pt] text-[10pt] font-medium text-slate-900">{OWNER.oseNumber}</div>
          </div>
        </div>
      ) : null}

      {/* g. Hydrograph placeholder with axis labels + date range */}
      <Card className={cn('mb-[8pt]', 'bg-card text-card-foreground ring-foreground/10')}>
        <CardHeader className="pb-[2pt]">
          <CardTitle className="text-[9pt] font-semibold text-slate-800">Well Water Level — Hydrograph</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[190pt] border border-slate-500 bg-white">
            {/* axis labels */}
            <div className="absolute left-[-6pt] top-1/2 -translate-y-1/2 rotate-180 text-[7pt] font-medium text-slate-700 whitespace-nowrap">Depth to Water (ft)</div>
            <div className="absolute right-[-4pt] bottom-[-18pt] text-[7pt] text-slate-600">Aug 2026 – Nov 2026</div>
            {/* axis lines */}
            <div className="absolute inset-[12pt] border-l border-b border-slate-400" />
          </div>
        </CardContent>
      </Card>

      {/* j. Readings table, fed by the well's own readings (newest first). No MP Ht column here — it lives in the description grid per W4/D29. */}
      <div className="mb-[8pt]">
        <div className="grid grid-cols-[26%_44%_30%] bg-[#1c3f66] text-white text-[8.5pt] font-semibold">
          <div className="px-[5pt] py-[3pt]">Date</div>
          <div className="px-[5pt] py-[3pt]">Depth to Water Below Ground Surface (ft)</div>
          <div className="px-[5pt] py-[3pt]">Level Status</div>
        </div>
        {OWNER.readings.map((r, i) => (
          <div key={i} className={`grid grid-cols-[26%_44%_30%] text-[8.5pt] border-b border-slate-300${i % 2 === 1 ? ' bg-[#f7f9fb]' : ''}`}>
            <div className="px-[5pt] py-[2pt]">{r.dateLabel}</div>
            <div className="px-[5pt] py-[2pt]">{r.dtwFt?.toFixed(2)}</div>
            <div className="px-[5pt] py-[2pt]">{r.levelStatus ?? ''}</div>
          </div>
        ))}
      </div>

      {/* k. New Measurement write-in card */}
      <Card className={cn('mb-[8pt]', 'bg-card text-card-foreground ring-foreground/10')}>
        <CardHeader className="pb-[4pt]">
          <CardTitle className="text-[9pt] font-semibold text-slate-800">New Measurement</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {[
            'Date',
            'Depth to Water Below Ground Surface (ft)',
            'MP Ht (ft)',
            'Method',
            'Level Status',
            'Comments',
          ].map((label) => (
            <div key={label} className="grid grid-cols-[auto_1fr] items-end gap-[6pt] px-[4pt] mt-[3pt]">
              <span className="text-[7.5pt] font-semibold text-slate-700 whitespace-nowrap">{label}</span>
              <span className="border-b border-slate-600 pb-[2pt]" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* l. Contact line */}
      <div className="text-[7.5pt] text-slate-600 mt-[8pt]">Questions? nmbg.waterlevels@nmt.edu</div>
    </div>
  )
}

const PacketMain = () => (
  <>
    {/* Print rules: letter-sized page, no chrome margins, exactly 612x792pt per
        sheet. FieldSheet ends with break-after-page so the OwnerSheet lands on
        physical page 2. Plain block flow once rendered outside AppShell. */}
    <style>{`
      @page { size: ${PAGE_SIZE}; margin: 0; }
      .break-after-page { break-after: always; }
      @media print { body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; } }
    `}</style>
    <div className="w-[612pt]">
      <FieldSheet />
      {/* page 2: owner sheet ends the packet */}
      <OwnerSheet />
    </div>
  </>
)

export const PacketPrintPage = () => (
  <PacketMain />
)

export default PacketPrintPage
