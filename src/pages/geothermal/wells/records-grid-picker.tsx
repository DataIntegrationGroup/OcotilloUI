import { useList, useGo } from '@refinedev/core'
import type { IWell } from '@/interfaces/geothermal'
import { useAccessCapabilities } from '@/hooks'
import { canEnterGeothermalData } from './recordsGridLogic'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function wellLabel(w: IWell): string {
  const parts = [w.county, w.well_type].filter(Boolean)
  const suffix = parts.length ? ` — ${parts.join(', ')}` : ''
  return `${w.name ?? w.well_data_id}${suffix}`
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

  const { query } = useList<IWell>({
    resource: 'thing/geothermal-well',
    dataProviderName: 'geothermal',
    pagination: { pageSize: 500, mode: 'server' },
    queryOptions: { enabled: canEnterGeothermalData(canManageGeothermal) },
  })

  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Checking access…
      </div>
    )
  }

  if (!canEnterGeothermalData(canManageGeothermal)) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        You need the Geothermal Admin role to enter well data.
      </div>
    )
  }

  // Radix SelectItem forbids an empty value, so drop rows without a usable id.
  const wells = (query.data?.data ?? []).filter(
    (w) => w.well_data_id != null && w.well_data_id !== ''
  )

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
            <SelectItem key={w.well_data_id} value={w.well_data_id}>
              {wellLabel(w)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
