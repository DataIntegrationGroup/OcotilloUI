import { string } from 'yup'
import { useLink } from '@refinedev/core'

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

export const linkColumn = (resource, options) => {
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
          {params.value}
        </Link>
      )
    },
  }
}
