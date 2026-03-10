import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { IContact } from '@/interfaces/ocotillo/IContact'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'

export const ContactShow = () => {
  const { query, result } = useShow({})
  const record = result as IContact

  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={query.isLoading}>
      <DynamicShowDisplay record={record} fieldConfigs={fieldConfigs} />
    </Show>
  )
}
