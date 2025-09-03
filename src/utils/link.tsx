import { string } from 'yup'
import { useLink } from '@refinedev/core'

export const extractThingTypeResource = (getThingType: Function) => {
  return (params) => {
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

export const linkColumn = (
  resource: string | Function,
  options: { field: string; [key: string]: any },
  renderLabel?: Function
) => {
  const Link = useLink()
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
      
      const fieldPath = options.field;
      let id = null;
      
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
