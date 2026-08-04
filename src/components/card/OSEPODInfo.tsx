import { Engineering } from '@mui/icons-material'
import { useMemo } from 'react'
import { useOSEPODInfo } from '@/hooks'
import { buildOSEPODRawRows, buildOSEPODSections } from '@/utils/osePodSummary'
import { AttributeInfoCard } from './AttributeInfoCard'

type OSEPODInfoCardProps = {
  pod_id: string
}

export const OSEPODInfoCard = ({ pod_id }: OSEPODInfoCardProps) => {
  const podInfoQuery = useOSEPODInfo(pod_id)
  const attributes = podInfoQuery.data

  const sections = useMemo(() => buildOSEPODSections(attributes), [attributes])
  const rawRows = useMemo(() => buildOSEPODRawRows(attributes), [attributes])

  return (
    <AttributeInfoCard
      icon={<Engineering color="primary" />}
      title="OSE POD Information"
      sections={sections}
      rawRows={rawRows}
      emptyMessage="No OSE POD data available for this well."
      errorMessage="Error fetching OSE POD info."
      isLoading={podInfoQuery.isLoading}
      isError={podInfoQuery.isError}
    />
  )
}
