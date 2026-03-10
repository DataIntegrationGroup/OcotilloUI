import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { ISpring } from '@/interfaces/ocotillo'

export const SpringShow = () => {
  const { query, result } = useShow({})
  const record = result as ISpring

  // Custom configs for springs
  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={query.isLoading}>
      <DynamicShowDisplay<ISpring>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
