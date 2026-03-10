import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { ISample } from '@/interfaces/ocotillo/ISample'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'

export const SampleShow = () => {
  const { query, result } = useShow({})
  const record = result as ISample

  //custom configs for sample
  const fieldConfigs = {
    sample_date: {
      label: 'Sample Date', //sample date time
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  //use new component
  return (
    <Show isLoading={query.isLoading}>
      <DynamicShowDisplay<ISample>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
