import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { ISpring } from '@/interfaces/ocotillo'

export const SpringShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as ISpring

  // Custom configs for springs
  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay<ISpring>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
