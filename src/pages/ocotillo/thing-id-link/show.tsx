import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { IThingIdLink } from '@/interfaces/ocotillo'

export const ThingIdLinkShow = () => {
  const { query, result } = useShow({})
  const record = result as IThingIdLink

  //custom configs for sensor date fields
  const fieldConfigs = {}

  return (
    <Show isLoading={query.isLoading}>
      <DynamicShowDisplay<IThingIdLink>
        record={record}
        fieldConfigs={fieldConfigs}
      />
    </Show>
  )
}
