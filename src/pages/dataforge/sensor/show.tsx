import { Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { Show, TextFieldComponent as TextField } from '@refinedev/mui'

export const SensorShow = () => {
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
          {'Name'}
        </Typography>
        <TextField value={record?.name} />

        <Typography variant="body1" fontWeight="bold">
          {'Model'}
        </Typography>
        <TextField value={record?.model} />

        <Typography variant="body1" fontWeight="bold">
          {'Serial No'}
        </Typography>
        <TextField value={record?.serial_no} />

        <Typography variant="body1" fontWeight="bold">
          {'Date Installed'}
        </Typography>
        <TextField value={record?.date_installed} />

        <Typography variant="body1" fontWeight="bold">
          {'Date Removed'}
        </Typography>
        <TextField value={record?.date_removed} />

        <Typography variant="body1" fontWeight="bold">
          {'Notes'}
        </Typography>
        <TextField value={record?.notes} />

      </Stack>
    </Show>
  )
}
