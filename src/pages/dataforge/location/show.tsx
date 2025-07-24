import { Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { Show, TextFieldComponent as TextField } from '@refinedev/mui'

export const LocationShow = () => {
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
          {'Point'}
        </Typography>
        <TextField value={record?.point} />

        <Typography variant="body1" fontWeight="bold">
          {'Release Status'}
        </Typography>
        <TextField value={record?.release_status} />

        <Typography variant="body1" fontWeight="bold">
          {'Notes'}
        </Typography>
        <TextField value={record?.notes} />

        <Typography variant="body1" fontWeight="bold">
          {'Created At'}
        </Typography>
        <TextField value={record?.created_at} />
      </Stack>
    </Show>
  )
}
