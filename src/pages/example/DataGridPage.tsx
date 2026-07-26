// TEMPORARY — Glide Data Grid specimen page. Delete when design work is settled.
import { useEffect, useState } from 'react'
import { useList, useNavigation } from '@refinedev/core'
import type { IWell } from '@/interfaces/ocotillo'
import { displayWellSiteName, formatAppDate } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
import {
  EditableDataGrid,
  type CellValue,
  type GridColumnSpec,
} from '@/components/grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  EditPanel,
  EditPanelField,
  EditPanelLayout,
  EditPanelSection,
} from '@/components/editing'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Download,
  ExternalLink,
  Filter,
  Rows3,
  Upload,
  X,
} from 'lucide-react'

function setWellField(well: IWell, colId: string, value: CellValue): IWell {
  return { ...well, [colId]: value } as IWell
}

const COLUMNS: GridColumnSpec<IWell>[] = [
  {
    title: 'Well ID',
    id: 'name',
    width: 140,
    kind: 'uri',
    getValue: (w) => w.name ?? '',
  },
  {
    title: 'Site Name',
    id: 'site_name',
    width: 200,
    editable: true,
    getValue: (w) => displayWellSiteName(w),
    setValue: (w, v) => setWellField(w, 'site_name', v),
  },
  {
    title: 'Monitoring',
    id: 'monitoring_status',
    width: 160,
    editable: true,
    getValue: (w) => w.monitoring_status ?? '',
    setValue: (w, v) => setWellField(w, 'monitoring_status', v),
  },
  {
    title: 'Well Status',
    id: 'well_status',
    width: 150,
    editable: true,
    getValue: (w) => w.well_status ?? '',
    setValue: (w, v) => setWellField(w, 'well_status', v),
  },
  {
    title: 'Type',
    id: 'thing_type',
    width: 130,
    editable: true,
    getValue: (w) => w.thing_type ?? '',
    setValue: (w, v) => setWellField(w, 'thing_type', v),
  },
  {
    title: 'Release Status',
    id: 'release_status',
    width: 130,
    editable: true,
    getValue: (w) => w.release_status ?? '',
    setValue: (w, v) => setWellField(w, 'release_status', v),
  },
  {
    title: 'Well Depth (ft)',
    id: 'well_depth',
    width: 130,
    kind: 'number',
    editable: true,
    getValue: (w) => w.well_depth ?? null,
    setValue: (w, v) => setWellField(w, 'well_depth', v),
  },
  {
    title: 'First Visit',
    id: 'first_visit_date',
    width: 120,
    editable: true,
    getValue: (w) => formatAppDate(w.first_visit_date),
    setValue: (w, v) => setWellField(w, 'first_visit_date', v),
  },
  {
    title: 'Aquifers',
    id: 'aquifers',
    width: 240,
    getValue: (w) => w.aquifers?.map((a) => a.aquifer_system).join(', ') ?? '',
  },
  {
    title: 'Contacts',
    id: 'contacts',
    width: 240,
    getValue: (w) =>
      w.contacts?.map((c) => getContactDisplayName(c)).join(', ') ?? '',
  },
  {
    title: 'Created',
    id: 'created_at',
    width: 120,
    getValue: (w) => formatAppDate(w.created_at),
  },
]

function CreateWellPanel({ onClose }: { onClose: () => void }) {
  return (
    <EditPanel
      title="Create Well"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm">Create Well</Button>
        </>
      }
    >
      <EditPanelSection title="Identity">
        <EditPanelField label="Well ID" required span="full">
          <Input placeholder="e.g. AB-0001" />
        </EditPanelField>
        <EditPanelField label="Site Name" span="full">
          <Input placeholder="Monitoring site or alternate name" />
        </EditPanelField>
        <EditPanelField label="Type" required>
          <Select>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="water well">Water Well</SelectItem>
              <SelectItem value="geothermal well">Geothermal Well</SelectItem>
            </SelectContent>
          </Select>
        </EditPanelField>
        <EditPanelField label="Release Status" required>
          <Select>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="unreleased">Unreleased</SelectItem>
              <SelectItem value="embargoed">Embargoed</SelectItem>
            </SelectContent>
          </Select>
        </EditPanelField>
      </EditPanelSection>

      <Separator />

      <EditPanelSection title="Status">
        <EditPanelField label="Well Status">
          <Select>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="destroyed">Destroyed</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </EditPanelField>
        <EditPanelField label="Monitoring Status">
          <Select>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="proposed">Proposed</SelectItem>
            </SelectContent>
          </Select>
        </EditPanelField>
        <EditPanelField label="First Visit Date">
          <Input type="date" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Suitable for Datalogger" span="full">
          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="datalogger" />
            <label htmlFor="datalogger" className="text-sm cursor-pointer">
              Yes, this well can accept a datalogger
            </label>
          </div>
        </EditPanelField>
      </EditPanelSection>

      <Separator />

      <EditPanelSection title="Physical Dimensions">
        <EditPanelField label="Well Depth (ft)">
          <Input type="number" placeholder="0" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Hole Depth (ft)">
          <Input type="number" placeholder="0" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Casing Diameter (in)">
          <Input type="number" placeholder="0" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Casing Depth (ft)">
          <Input type="number" placeholder="0" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Casing Materials" span="full">
          <Input placeholder="e.g. steel, PVC" className="h-8 text-sm" />
        </EditPanelField>
      </EditPanelSection>

      <Separator />

      <EditPanelSection title="Drilling">
        <EditPanelField label="Completion Date" span="full">
          <Input type="date" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Driller Name" span="full">
          <Input placeholder="Drilling company" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Construction Method">
          <Input placeholder="e.g. rotary" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Formation Code">
          <Input placeholder="Code" className="h-8 text-sm" />
        </EditPanelField>
      </EditPanelSection>

      <Separator />

      <EditPanelSection title="Pump">
        <EditPanelField label="Pump Type">
          <Input placeholder="e.g. submersible" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Pump Depth (ft)">
          <Input type="number" placeholder="0" className="h-8 text-sm" />
        </EditPanelField>
      </EditPanelSection>

      <Separator />

      <EditPanelSection title="Measuring Point">
        <EditPanelField label="Height (ft)">
          <Input type="number" placeholder="0" className="h-8 text-sm" />
        </EditPanelField>
        <EditPanelField label="Description" span="full">
          <Textarea
            placeholder="Describe the measuring point…"
            className="text-sm resize-none"
            rows={2}
          />
        </EditPanelField>
      </EditPanelSection>

      <Separator />

      <EditPanelSection title="Location" defaultOpen={false}>
        <EditPanelField label="Latitude">
          <Input
            type="number"
            step="0.000001"
            placeholder="e.g. 35.682"
            className="h-8 text-sm"
          />
        </EditPanelField>
        <EditPanelField label="Longitude">
          <Input
            type="number"
            step="0.000001"
            placeholder="e.g. -106.044"
            className="h-8 text-sm"
          />
        </EditPanelField>
      </EditPanelSection>

      <Separator />

      <EditPanelSection title="Notes" defaultOpen={false}>
        <EditPanelField label="General Notes" span="full">
          <Textarea
            placeholder="Any general notes about this well…"
            className="text-sm resize-none"
            rows={3}
          />
        </EditPanelField>
      </EditPanelSection>
    </EditPanel>
  )
}

type BulkRow = Partial<Record<string, CellValue>>

function makeBulkRow(): BulkRow {
  return {}
}

// Columns shown in the bulk-add modal (subset, all editable)
const BULK_COLUMNS: GridColumnSpec<BulkRow>[] = [
  {
    title: 'Well ID *',
    id: 'name',
    width: 160,
    group: 'Required',
    editable: true,
    getValue: (r) => r.name ?? '',
    setValue: (r, v) => ({ ...r, name: v }),
  },
  {
    title: 'Type *',
    id: 'thing_type',
    width: 140,
    group: 'Required',
    editable: true,
    getValue: (r) => r.thing_type ?? '',
    setValue: (r, v) => ({ ...r, thing_type: v }),
  },
  {
    title: 'Site Name',
    id: 'site_name',
    width: 200,
    group: 'Basics',
    editable: true,
    getValue: (r) => r.site_name ?? '',
    setValue: (r, v) => ({ ...r, site_name: v }),
  },
  {
    title: 'Release Status',
    id: 'release_status',
    width: 140,
    group: 'Basics',
    editable: true,
    getValue: (r) => r.release_status ?? '',
    setValue: (r, v) => ({ ...r, release_status: v }),
  },
  {
    title: 'Well Status',
    id: 'well_status',
    width: 140,
    group: 'Basics',
    editable: true,
    getValue: (r) => r.well_status ?? '',
    setValue: (r, v) => ({ ...r, well_status: v }),
  },
  {
    title: 'Monitoring',
    id: 'monitoring_status',
    width: 140,
    group: 'Basics',
    editable: true,
    getValue: (r) => r.monitoring_status ?? '',
    setValue: (r, v) => ({ ...r, monitoring_status: v }),
  },
  {
    title: 'Well Depth (ft)',
    id: 'well_depth',
    width: 130,
    group: 'Details',
    kind: 'number',
    editable: true,
    getValue: (r) => (r.well_depth ?? null) as CellValue,
    setValue: (r, v) => ({ ...r, well_depth: v as number | null }),
  },
  {
    title: 'First Visit',
    id: 'first_visit_date',
    width: 120,
    group: 'Details',
    editable: true,
    getValue: (r) => r.first_visit_date ?? '',
    setValue: (r, v) => ({ ...r, first_visit_date: v }),
  },
]

const BULK_ROWS = 20

function BulkAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: BULK_ROWS }, makeBulkRow)
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col gap-0 p-0 w-[92vw] max-w-[92vw] h-[90vh] overflow-hidden [&>button]:hidden"
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center gap-3 shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-base font-semibold">
            Bulk add wells
          </DialogTitle>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Beta
          </span>
          <button
            onClick={onClose}
            className="ml-auto rounded p-1 opacity-60 hover:opacity-100 hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        {/* Body: grid + tips sidebar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <EditableDataGrid
            columns={BULK_COLUMNS}
            rows={rows}
            onRowsChange={setRows}
            rowMarkers="number"
            groupHeaderHeight={28}
          />

          {/* Tips sidebar */}
          <div className="w-56 shrink-0 border-l bg-muted/30 flex flex-col overflow-y-auto px-5 py-5 text-sm">
            <p className="font-semibold mb-4">Three things to know!</p>
            <ol className="flex flex-col gap-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1</span>
                {' – '}This spreadsheet is just for adding new wells. Records you
                create here will not be live until reviewed.
              </li>
              <li>
                <span className="font-medium text-foreground">2</span>
                {' – '}Click any column header to see a description of that field
                and what values are accepted.
              </li>
              <li>
                <span className="font-medium text-foreground">3</span>
                {' – '}Use this table just like a spreadsheet — copy and paste
                directly from Excel or Google Sheets.
              </li>
            </ol>
            <div className="mt-auto pt-6">
              <button className="w-full rounded border border-border bg-background py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Get help
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t px-6 py-3 flex items-center gap-6">
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Download className="size-4" />
              Download Template
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="size-4" />
              Open in Google Sheets
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="size-4" />
              Upload CSV
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={onClose}>
              Create Wells
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DataGridPage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const { query } = useList<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: 200, mode: 'server' },
    meta: { params: { include_contacts: true } },
  })

  // Local copy of wells so edits update the grid without hitting the API
  const [localWells, setLocalWells] = useState<IWell[]>([])
  useEffect(() => {
    if (query.data?.data) setLocalWells(query.data.data)
  }, [query.data])

  const { show } = useNavigation()

  const columns: GridColumnSpec<IWell>[] = COLUMNS.map((c) =>
    c.id === 'name'
      ? { ...c, onClick: (well: IWell) => show('ocotillo.thing', well.id) }
      : c
  )

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-2 pr-4 py-2 pt-6">
        <span className="text-2xl font-black mr-5">Wells</span>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="size-3.5" />
          Filter
        </Button>
        <Input placeholder="Search…" className="h-8 w-56 text-sm" />
        <div className="ml-auto flex items-center rounded-md overflow-hidden">
          <Button
            size="sm"
            className="gap-1.5 rounded-none border-0"
            onClick={() => setPanelOpen(true)}
          >
            Create Well
          </Button>
          <div className="w-px self-stretch bg-primary-foreground/25 shrink-0" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="default"
                className="rounded-none border-0 px-2.5"
                onClick={() => setBulkOpen(true)}
              >
                <Rows3 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Bulk add</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Grid + create panel row */}
      <EditPanelLayout
        open={panelOpen}
        panel={<CreateWellPanel onClose={() => setPanelOpen(false)} />}
      >
        <EditableDataGrid
          columns={columns}
          rows={localWells}
          onRowsChange={setLocalWells}
          isLoading={query.isLoading}
          loadingMessage="Loading wells…"
          freezeColumns={1}
        />
      </EditPanelLayout>

      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  )
}
