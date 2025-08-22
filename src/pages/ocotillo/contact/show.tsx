import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { IContact } from '@/interfaces/ocotillo/IContact'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'

export const ContactShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as IContact

  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay record={record} fieldConfigs={fieldConfigs} />
    </Show>
  )
}
