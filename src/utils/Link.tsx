import { useLink } from '@refinedev/core'
import type { ComponentType, ReactNode } from 'react'

export const extractThingTypeResource = (getThingType: (params: any) => string) => {
  return (params: any) => {
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

export const linkColumn = (
  link: ComponentType<{ go: { to: { resource: string; action: string; id: unknown } }; children: ReactNode }>,
  resource: string | ((params: any) => string),
  options: { field: string; [key: string]: any },
  renderLabel?: (params: any) => ReactNode
) => {
  const Link = link
  return {
    ...options,
    renderCell: (params) => {
      const getNestedValue = (obj: any, path: string) => {
        if (!obj) return null
        return path.split('.').reduce((current, key) => {
          if (current === null || current === undefined) return null
          return current[key]
        }, obj)
      }

      const fieldPath = options.field
      let id = null

      if (fieldPath.includes('.')) {
        // Handle nested field access
        id = getNestedValue(params.row, fieldPath)
      } else {
        id = params.value
      }
      // Don't render link if ID is missing
      if (!id) {
        return renderLabel ? renderLabel(params) : '-'
      }

      return (
        <Link
          go={{
            to: {
              resource:
                typeof resource === 'string' ? resource : resource(params),
              action: 'show',
              id: id,
            },
          }}
        >
          {renderLabel ? renderLabel(params) : params.value}
        </Link>
      )
    },
  }
}
