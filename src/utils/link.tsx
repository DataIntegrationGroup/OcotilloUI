export const linkColumn = (options, Link) => {
  return {
    ...options,
    renderCell: (params) => {
      return (
        <Link
          go={{
            to: {
              resource: 'ocotillo.thing-well',
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
