import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { IThingIdLink } from '@/interfaces/ocotillo'

export const ThingIdLinkShow = () => {
  const { queryResult } = useShow({})
  const { data, isLoading } = queryResult
  const record = data?.data as IThingIdLink

  //custom configs for sensor date fields
  const fieldConfigs = {}

  return (
    <Show isLoading={isLoading}>
      <DynamicShowDisplay<IThingIdLink>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
