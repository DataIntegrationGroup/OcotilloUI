import { string } from 'yup'
import { useLink } from '@refinedev/core'
import { render } from 'react-dom'

// export const extractThingTypeResource = (getThingType) => {
//   return () => {
//     switch (getThingType()) {
//       case 'water well':
//         return 'ocotillo.thing-well'
//       case 'spring':
//         return 'ocotillo.thing-spring'
//       default:
//         return 'ocotillo.thing-well'
//     }
//   }
// }
export const extractThingTypeResource = (getThingType) => {
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

export const linkColumn = (resource, options, renderLabel?) => {
  const Link = useLink()
  return {
    ...options,
    renderCell: (params) => {
      if (typeof resource !== 'string') {
        resource = resource(params)
      }

      return (
        <Link
          go={{
            to: {
              resource: resource,
              action: 'show',
              id: params.value,
            },
          }}
        >
          {renderLabel ? renderLabel(params) : params.value}
        </Link>
      )
    },
  }
}
