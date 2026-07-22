import { useLink } from '@refinedev/core'
import type { BaseKey } from '@refinedev/core'
import type { ReactNode } from 'react'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

export const extractThingTypeResource = (
  getThingType: (params: GridRenderCellParams) => string
) => {
  return (params: GridRenderCellParams) => {
    const thingType = getThingType(params)
    switch (thingType) {
      case 'water well':
        return 'ocotillo.thing-well'
      case 'spring':
        return 'ocotillo.thing-spring'
      default:
        return 'ocotillo.thing-well'
    }
  }
}

export { useLink }

type RefineLinkComponent = ReturnType<typeof useLink>

export const linkColumn = <TRow extends object>(
  link: RefineLinkComponent,
  resource: string | ((params: GridRenderCellParams<TRow>) => string),
  options: { field: string } & Partial<GridColDef<TRow>>,
  renderLabel?: (params: GridRenderCellParams<TRow>) => ReactNode
) => {
  const Link = link
  return {
    ...options,
    renderCell: (params: GridRenderCellParams<TRow>) => {
      const getNestedValue = (
        obj: Record<string, unknown> | null | undefined,
        path: string
      ): unknown => {
        if (!obj) return null
        return path.split('.').reduce<unknown>((current, key) => {
          if (current === null || current === undefined) return null
          if (typeof current !== 'object') return null
          return (current as Record<string, unknown>)[key]
        }, obj)
      }

      const fieldPath = options.field
      let id: unknown = null

      if (fieldPath.includes('.')) {
        id = getNestedValue(
          params.row as Record<string, unknown>,
          fieldPath
        )
      } else {
        id = params.value
      }

      if (!id) {
        return renderLabel ? renderLabel(params) : '-'
      }

      return Link({
        go: {
          to: {
            resource:
              typeof resource === 'string' ? resource : resource(params),
            action: 'show',
            id: id as BaseKey,
          },
        },
        children: renderLabel ? renderLabel(params) : params.value,
      } as Parameters<RefineLinkComponent>[0])
    },
  }
}
