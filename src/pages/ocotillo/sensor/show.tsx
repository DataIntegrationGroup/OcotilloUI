import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { Show, TextFieldComponent as TextField } from '@refinedev/mui'
import { ISensor } from '@/interfaces/ocotillo/ISensor'

export const SensorShow = () => {
  const { query, result } = useShow({})
  const record = result as ISensor

  //custom configs for sensor date fields
  const fieldConfigs = {
    datetime_installed: {
      label: 'Date Installed',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
    datetime_removed: {
      label: 'Date Removed',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={query.isLoading}>
      <DynamicShowDisplay<ISensor>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
