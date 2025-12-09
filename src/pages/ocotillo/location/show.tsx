import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { FieldConfigs } from '@/interfaces'

export const LocationShow = () => {
  const { queryResult } = useShow<ILocation>({})
  const { data, isLoading } = queryResult
  const record = data?.data

  //custom configs for location
  const fieldConfigs: FieldConfigs<ILocation> = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay<ILocation>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
