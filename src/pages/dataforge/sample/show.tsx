import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { ISample } from '@/interfaces/dataforge/ISample'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'

export const SampleShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as ISample

  //custom configs for sample
  const fieldConfigs = {
    sample_date: {
      label: 'Sample Date', //sample date time
      formatter: (value: string) => value ? new Date(value).toLocaleString() : ''
    }
  }

  //use new component
  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay<ISample> 
        record={record} 
        fieldConfigs={fieldConfigs} 
      />
    </Show>
  )
}
