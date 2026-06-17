// TEMPORARY — Glide Data Grid specimen page. Delete when design work is settled.
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import '@glideapps/glide-data-grid/dist/index.css'
import {
  DataEditor,
  EditableGridCell,
  GridCell,
  GridCellKind,
  GridColumn,
  Item,
} from '@glideapps/glide-data-grid'
import { useList, useNavigation } from '@refinedev/core'
import { ColorModeContext } from '@/contexts'
import type { IWell } from '@/interfaces/ocotillo'
import { displayWellSiteName, formatAppDate } from '@/utils'
import { getContactDisplayName } from '@/utils/contactDisplayName'
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

const COLUMNS: GridColumn[] = [
  { title: 'Well ID',          id: 'name',              width: 140 },
  { title: 'Site Name',        id: 'site_name',         width: 200 },
  { title: 'Monitoring',       id: 'monitoring_status', width: 160 },
  { title: 'Well Status',      id: 'well_status',       width: 150 },
  { title: 'Type',             id: 'thing_type',        width: 130 },
  { title: 'Release Status',   id: 'release_status',    width: 130 },
  { title: 'Well Depth (ft)',  id: 'well_depth',        width: 130 },
  { title: 'First Visit',      id: 'first_visit_date',  width: 120 },
  { title: 'Aquifers',         id: 'aquifers',          width: 240 },
  { title: 'Contacts',         id: 'contacts',          width: 240 },
  { title: 'Created',          id: 'created_at',        width: 120 },
]

function getCellValue(well: IWell, colId: string): string {
  switch (colId) {
    case 'name':              return well.name ?? ''
    case 'site_name':         return displayWellSiteName(well)
    case 'monitoring_status': return well.monitoring_status ?? ''
    case 'well_status':       return well.well_status ?? ''
    case 'thing_type':        return well.thing_type ?? ''
    case 'release_status':    return well.release_status ?? ''
    case 'well_depth':        return well.well_depth != null ? String(well.well_depth) : ''
    case 'first_visit_date':  return formatAppDate(well.first_visit_date)
    case 'aquifers':          return well.aquifers?.map(a => a.aquifer_system).join(', ') ?? ''
    case 'contacts':          return well.contacts?.map(c => getContactDisplayName(c)).join(', ') ?? ''
    case 'created_at':        return formatAppDate(well.created_at)
    default:                  return ''
  }
}

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

// Columns shown in the bulk-add modal (subset, all editable)
const BULK_COLUMNS: GridColumn[] = [
  { title: 'Well ID *',        id: 'name',              width: 160, group: 'Required' },
  { title: 'Type *',           id: 'thing_type',        width: 140, group: 'Required' },
  { title: 'Site Name',        id: 'site_name',         width: 200, group: 'Basics'   },
  { title: 'Release Status',   id: 'release_status',    width: 140, group: 'Basics'   },
  { title: 'Well Status',      id: 'well_status',       width: 140, group: 'Basics'   },
  { title: 'Monitoring',       id: 'monitoring_status', width: 140, group: 'Basics'   },
  { title: 'Well Depth (ft)',  id: 'well_depth',        width: 130, group: 'Details'  },
  { title: 'First Visit',      id: 'first_visit_date',  width: 120, group: 'Details'  },
]

const BULK_ROWS = 20
type BulkRow = Partial<Record<string, string | number | null>>

function makeBulkRow(): BulkRow { return {} }

function BulkAddModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const gdgTheme = useGdgTheme()
  // Callback ref: fires the moment the element mounts in the portal, not on the
  // initial render of BulkAddModal (when the dialog is still closed and the
  // portal hasn't rendered yet). This fixes the ResizeObserver never attaching.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: BULK_ROWS }, makeBulkRow)
  )

  useEffect(() => {
    if (!containerEl) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width:  entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(containerEl)
    return () => observer.disconnect()
  }, [containerEl])

  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const colDef = BULK_COLUMNS[col]
      const cell = rows[row]
      const raw = cell?.[colDef.id ?? '']
      const value = raw != null ? String(raw) : ''

      if (colDef.id === 'well_depth') {
        return {
          kind: GridCellKind.Number,
          data: typeof raw === 'number' ? raw : undefined,
          displayData: value,
          allowOverlay: true,
          readonly: false,
        }
      }
      return {
        kind: GridCellKind.Text,
        data: value,
        displayData: value,
        allowOverlay: true,
        readonly: false,
      }
    },
    [rows]
  )

  const onCellEdited = useCallback(
    ([col, row]: Item, newValue: EditableGridCell) => {
      const colDef = BULK_COLUMNS[col]
      setRows(prev => {
        const updated = [...prev]
        const r = { ...updated[row] }
        if (newValue.kind === GridCellKind.Number) {
          r[colDef.id ?? ''] = newValue.data ?? null
        } else if (newValue.kind === GridCellKind.Text) {
          r[colDef.id ?? ''] = newValue.data === '' ? null : newValue.data
        }
        updated[row] = r
        return updated
      })
    },
    []
  )

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent aria-describedby={undefined} className="flex flex-col gap-0 p-0 w-[92vw] max-w-[92vw] h-[90vh] overflow-hidden [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center gap-3 shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-base font-semibold">Bulk add wells</DialogTitle>
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
          {/* Grid — callback ref fires when portal mounts; no overflow-hidden so editing overlay is visible */}
          <div ref={setContainerEl} className="flex flex-col flex-1 min-w-0">
            {size.width > 0 && (
              <DataEditor
                columns={BULK_COLUMNS}
                rows={rows.length}
                getCellContent={getCellContent}
                onCellEdited={onCellEdited}
                width={size.width}
                height={size.height}
                rowHeight={36}
                headerHeight={38}
                rowMarkers="number"
                smoothScrollX
                smoothScrollY
                groupHeaderHeight={28}
                theme={gdgTheme}
                getGroupDetails={(group) => ({ name: group })}
              />
            )}
          </div>

          {/* Tips sidebar */}
          <div className="w-56 shrink-0 border-l bg-muted/30 flex flex-col overflow-y-auto px-5 py-5 text-sm">
            <p className="font-semibold mb-4">Three things to know!</p>
            <ol className="flex flex-col gap-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">1</span>
                {' – '}This spreadsheet is just for adding new wells. Records you create here will not be live until reviewed.
              </li>
              <li>
                <span className="font-medium text-foreground">2</span>
                {' – '}Click any column header to see a description of that field and what values are accepted.
              </li>
              <li>
                <span className="font-medium text-foreground">3</span>
                {' – '}Use this table just like a spreadsheet — copy and paste directly from Excel or Google Sheets.
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

// Explicit color themes so the overlay editor's text input is always visible.
// Only colors are set — font properties are left to GDG defaults.
const GDG_THEME_LIGHT = {
  textDark: '#0f172a',
  textMedium: '#475569',
  textLight: '#94a3b8',
  textHeader: '#64748b',
  textHeaderSelected: '#0f172a',
  textBubble: '#0f172a',
  bgCell: '#ffffff',
  bgCellMedium: '#f8fafc',
  bgHeader: '#f1f5f9',
  bgHeaderHasFocus: '#e2e8f0',
  bgHeaderHovered: '#e2e8f0',
  bgBubble: '#f1f5f9',
  bgBubbleSelected: '#dbeafe',
  bgSearchResult: '#fef9c3',
  accentColor: '#2563eb',
  accentFg: '#ffffff',
  accentLight: '#dbeafe',
  borderColor: '#e2e8f0',
  drilldownBorder: '#e2e8f0',
  linkColor: '#2563eb',
  bgIconHeader: '#f1f5f9',
  fgIconHeader: '#64748b',
}

const GDG_THEME_DARK = {
  textDark: '#f1f5f9',
  textMedium: '#94a3b8',
  textLight: '#64748b',
  textHeader: '#94a3b8',
  textHeaderSelected: '#f1f5f9',
  textBubble: '#f1f5f9',
  bgCell: '#18181b',
  bgCellMedium: '#27272a',
  bgHeader: '#27272a',
  bgHeaderHasFocus: '#3f3f46',
  bgHeaderHovered: '#3f3f46',
  bgBubble: '#27272a',
  bgBubbleSelected: '#1e3a5f',
  bgSearchResult: '#713f12',
  accentColor: '#3b82f6',
  accentFg: '#ffffff',
  accentLight: '#1e3a5f',
  borderColor: '#3f3f46',
  drilldownBorder: '#3f3f46',
  linkColor: '#60a5fa',
  bgIconHeader: '#27272a',
  fgIconHeader: '#94a3b8',
}

function useGdgTheme() {
  const { mode } = useContext(ColorModeContext)
  return mode === 'dark' ? GDG_THEME_DARK : GDG_THEME_LIGHT
}

// Columns that are editable inline (double-click to edit)
const EDITABLE_COLS = new Set([
  'site_name',
  'monitoring_status',
  'well_status',
  'thing_type',
  'release_status',
  'well_depth',
  'first_visit_date',
])

export function DataGridPage() {
  const gdgTheme = useGdgTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [panelOpen, setPanelOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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

  const isLoading = query.isLoading

  const { show } = useNavigation()

  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const well = localWells[row]
      if (!well) return { kind: GridCellKind.Loading, allowOverlay: false }
      const colDef = COLUMNS[col]
      const value = getCellValue(well, colDef.id ?? '')

      // Well ID column — URI link, not editable
      if (col === 0) {
        return {
          kind: GridCellKind.Uri,
          data: value,
          allowOverlay: false,
          readonly: true,
          hoverEffect: true,
        }
      }

      // Well Depth — numeric editor
      if (colDef.id === 'well_depth') {
        return {
          kind: GridCellKind.Number,
          data: well.well_depth ?? undefined,
          displayData: value,
          allowOverlay: true,
          readonly: false,
        }
      }

      // Editable text columns
      if (EDITABLE_COLS.has(colDef.id ?? '')) {
        return {
          kind: GridCellKind.Text,
          data: value,
          displayData: value,
          allowOverlay: true,
          readonly: false,
        }
      }

      // Read-only columns (aquifers, contacts, created_at)
      return {
        kind: GridCellKind.Text,
        data: value,
        displayData: value,
        allowOverlay: false,
        readonly: true,
      }
    },
    [localWells]
  )

  const onCellEdited = useCallback(
    ([col, row]: Item, newValue: EditableGridCell) => {
      const colDef = COLUMNS[col]
      setLocalWells(prev => {
        const updated = [...prev]
        const well = { ...updated[row] }
        const colId = colDef.id ?? ''

        if (newValue.kind === GridCellKind.Number) {
          (well as Record<string, unknown>)[colId] = newValue.data ?? null
        } else if (newValue.kind === GridCellKind.Text) {
          (well as Record<string, unknown>)[colId] =
            newValue.data === '' ? null : newValue.data
        }

        updated[row] = well
        return updated
      })
    },
    []
  )

  const handleCellClicked = useCallback(
    ([col, row]: Item) => {
      if (col !== 0) return
      const well = localWells[row]
      if (well) show('ocotillo.thing', well.id)
    },
    [localWells, show]
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
        <Input
          placeholder="Search…"
          className="h-8 w-56 text-sm"
        />
        <div className="ml-auto flex items-center rounded-md overflow-hidden">
          <Button size="sm" className="gap-1.5 rounded-none border-0" onClick={() => setPanelOpen(true)}>
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
        <div ref={containerRef} className="flex flex-col flex-1 min-w-0">
          {isLoading || size.width === 0 ? (
            <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
              Loading wells…
            </div>
          ) : (
            <DataEditor
              columns={COLUMNS}
              rows={localWells.length}
              getCellContent={getCellContent}
              onCellEdited={onCellEdited}
              onCellClicked={handleCellClicked}
              freezeColumns={1}
              width={size.width}
              height={size.height}
              rowHeight={36}
              headerHeight={38}
              smoothScrollX
              smoothScrollY
              theme={gdgTheme}
              rowMarkers="none"
            />
          )}
        </div>
      </EditPanelLayout>

      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  )
}
