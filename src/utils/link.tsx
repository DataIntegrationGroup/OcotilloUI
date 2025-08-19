import { string } from 'yup'

export const linkColumn = (resource, options, Link) => {
  return {
    ...options,
    renderCell: (params) => {
      console.log(params)

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
