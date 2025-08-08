import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IGroup } from '@/interfaces/dataforge/IGroup'

export const GroupShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as IGroup

  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) => value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay 
        record={record} 
        fieldConfigs={fieldConfigs} 
      />
    </Show>
  )
}
