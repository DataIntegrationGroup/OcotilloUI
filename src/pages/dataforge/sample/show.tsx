import { Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { Show, TextFieldComponent as TextField } from '@refinedev/mui'

export const SampleShow = () => {
  const { queryResult } = useShow({})

  const { data, isLoading } = queryResult

  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          {'ID'}
        </Typography>
        <TextField value={record?.id} />

        <Typography variant="body1" fontWeight="bold">
          {'Collection Timestamp'}
        </Typography>
        <TextField value={record?.collection_timestamp} />

        <Typography variant="body1" fontWeight="bold">
          {'Collection Method'}
        </Typography>
        <TextField value={record?.collection_method} />

        <Typography variant="body1" fontWeight="bold">
          {'Thing ID'}
        </Typography>
        <TextField value={record?.thing_id} />
      </Stack>
    </Show>
  )
}
