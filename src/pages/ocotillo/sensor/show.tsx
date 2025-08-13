import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { Show, TextFieldComponent as TextField } from '@refinedev/mui'
import { ISensor } from '@/interfaces/ocotillo/ISensor'

export const SensorShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as ISensor

  //custom configs for sensor date fields
  const fieldConfigs = {
    date_installed: {
      label: 'Date Installed',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
    date_removed: {
      label: 'Date Removed',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay<ISensor>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
