import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { IContact } from '@/interfaces/ocotillo/IContact'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { useAccessCapabilities } from '@/hooks'
import { sanitizeContact } from '@/utils'

export const ContactShow = () => {
  const { query, result } = useShow({})
  const { canViewConfidential } = useAccessCapabilities()
  const rawRecord = result as IContact | undefined
  const record =
    rawRecord != null
      ? sanitizeContact(rawRecord, canViewConfidential)
      : undefined

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
