import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IWell } from '@/interfaces/ocotillo/IThing'

export const WellShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as IWell

  // Custom configs for wells
  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay<IWell> record={record} fieldConfigs={fieldConfigs} />
    </Show>
  )
}
