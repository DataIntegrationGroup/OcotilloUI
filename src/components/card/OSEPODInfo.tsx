import { Engineering } from '@mui/icons-material'
import { useOSEPODInfo } from '@/hooks'
import { KeyValueInfoCard } from './KeyValueInfoCard'

type OSEPODInfoCardProps = {
  pod_id: string
}

export const OSEPODInfoCard = ({ pod_id }: OSEPODInfoCardProps) => {
  const podInfoQuery = useOSEPODInfo(pod_id)

  return (
    <KeyValueInfoCard
      icon={<Engineering color="primary" />}
      title="OSEPOD Information"
      linkLabel="NMWRRS Website Link"
      emptyMessage="No OSE POD data available for this well."
      errorMessage="Error fetching OSE POD info."
      rows={podInfoQuery.data}
      isLoading={podInfoQuery.isLoading}
      isError={podInfoQuery.isError}
    />
  )
}
