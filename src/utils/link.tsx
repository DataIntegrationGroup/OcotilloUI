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
  options: object,
  renderLabel?: Function
) => {
  const Link = useLink()
  return {
    ...options,
    renderCell: (params) => {
      return (
        <Link
          go={{
            to: {
              resource:
                typeof resource === 'string' ? resource : resource(params),
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
