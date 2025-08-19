import { string } from 'yup'
import { useLink } from '@refinedev/core'

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
