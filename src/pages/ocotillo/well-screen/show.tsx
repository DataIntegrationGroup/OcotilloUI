import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IWellScreen } from '@/interfaces/ocotillo/IWellScreen'
import Grid from '@mui/material/Grid2'

export const WellScreenShow = () => {
  const { query } = useShow<IWellScreen>({
    resource: 'ocotillo.thing/well-screen',
  })
  const { data, isLoading } = query
  const record = data?.data as IWellScreen

  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <DynamicShowDisplay record={record} fieldConfigs={fieldConfigs} />
        </Grid>
      </Grid>
    </Show>
  )
}
