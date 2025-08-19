export const linkColumn = (resource, options, Link) => {
  return {
    ...options,
    renderCell: (params) => {
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
