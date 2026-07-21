import { useList, useGo } from '@refinedev/core'
import type { IWell } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// The geothermal wells endpoint returns more than IWell currently types; read
// the label fields loosely until the contract/interface is finalized.
type WellRow = IWell & { WellDataID?: string; County?: string }

function wellLabel(w: WellRow): string {
  const parts = [w.WellDataID, w.County].filter(Boolean)
  const suffix = parts.length ? ` — ${parts.join(', ')}` : ''
  return `${w.OBJECTID}${suffix}`
}

/**
 * Sandbox entry point for the geothermal records grid. The grid itself is
 * scoped to one well (`records-grid/:id`); this page lets an admin pick a well
 * and navigates into its grid. Admin-gated per BDMS-878 (`canManageGeothermal`).
 */
export const GeoThermalRecordsGridPicker = () => {
  const go = useGo()
  const { canManageGeothermal, isLoading: permLoading } =
    useAccessCapabilities()

  const { query } = useList<WellRow>({
    resource: 'wells',
    dataProviderName: 'geothermal',
    pagination: { pageSize: 500, mode: 'server' },
    queryOptions: { enabled: canManageGeothermal },
  })

  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Checking access…
      </div>
    )
  }

  if (!canManageGeothermal) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        You need the Geothermal Admin role to enter well data.
      </div>
    )
  }

  const wells = query.data?.data ?? []

  return (
    <div className="flex flex-col gap-4 p-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black">Geothermal records</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a well to open its records data-entry grid.
        </p>
      </div>

      <Select
        disabled={query.isLoading || wells.length === 0}
        onValueChange={(value) =>
          go({ to: `/geothermal/wells/records-grid/${value}` })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              query.isLoading
                ? 'Loading wells…'
                : wells.length === 0
                  ? 'No wells found'
                  : 'Select a well…'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {wells.map((w) => (
            <SelectItem key={String(w.OBJECTID)} value={String(w.OBJECTID)}>
              {wellLabel(w)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
