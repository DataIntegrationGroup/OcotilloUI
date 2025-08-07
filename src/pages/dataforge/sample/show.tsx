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
          {'Thing ID'}
        </Typography>
        <TextField value={record?.thing_id} />

        <Typography variant="body1" fontWeight="bold">
          {'Sample Type'}
        </Typography>
        <TextField value={record?.sample_type} />

        <Typography variant="body1" fontWeight="bold">
          {'Field Sample ID'}
        </Typography>
        <TextField value={record?.field_sample_id} />

        <Typography variant="body1" fontWeight="bold">
          {'Sample Date'}
        </Typography>
        <TextField value={record?.sample_date} />

        <Typography variant="body1" fontWeight="bold">
          {'Release Status'}
        </Typography>
        <TextField value={record?.release_status} />

        <Typography variant="body1" fontWeight="bold">
          {'Sampler Name'}
        </Typography>
        <TextField value={record?.sampler_name} />

        <Typography variant="body1" fontWeight="bold">
          {'QC Sample'}
        </Typography>
        <TextField value={record?.qc_sample} />

        <Typography variant="body1" fontWeight="bold">
          {'Sensor ID'}
        </Typography>
        <TextField value={record?.sensor_id} />

        <Typography variant="body1" fontWeight="bold">
          {'Sample Matrix'}
        </Typography>
        <TextField value={record?.sample_matrix} />

        <Typography variant="body1" fontWeight="bold">
          {'Sample Method'}
        </Typography>
        <TextField value={record?.sample_method} />

        <Typography variant="body1" fontWeight="bold">
          {'Duplicate Sample Number'}
        </Typography>
        <TextField value={record?.duplicate_sample_number} />

        <Typography variant="body1" fontWeight="bold">
          {'Sample Top'}
        </Typography>
        <TextField value={record?.sample_top} />

        <Typography variant="body1" fontWeight="bold">
          {'Sample Bottom'}
        </Typography>
        <TextField value={record?.sample_bottom} />
      </Stack>
    </Show>
  )
}
