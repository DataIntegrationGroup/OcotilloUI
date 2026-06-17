import { WellStatusChips } from '@/components'
import { OcotilloPageTitle } from '@/components/OcotilloPageHeader'
import { IWell } from '@/interfaces/ocotillo'

export const WellShowTitle = ({
  well,
  isLoading,
}: {
  well: IWell
  isLoading: boolean
}) => {
  return (
    <OcotilloPageTitle
      title={well?.name ?? ''}
      isLoading={isLoading}
    >
      <WellStatusChips well={well} isLoading={isLoading} />
    </OcotilloPageTitle>
  )
}
