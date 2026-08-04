import { Public } from '@mui/icons-material'
import { useMemo } from 'react'
import { useUSGSSiteInfo } from '@/hooks'
import { buildUSGSRawRows, buildUSGSSections } from '@/utils/usgsSiteSummary'
import { AttributeInfoCard } from './AttributeInfoCard'

type USGSInfoCardProps = {
  site_id: string
}

export const USGSInfoCard = ({ site_id }: USGSInfoCardProps) => {
  const query = useUSGSSiteInfo(site_id)
  const info = query.data

  const sections = useMemo(() => buildUSGSSections(info), [info])
  const rawRows = useMemo(() => buildUSGSRawRows(info), [info])

  return (
    <AttributeInfoCard
      icon={<Public color="primary" />}
      title="USGS Information"
      sections={sections}
      rawRows={rawRows}
      emptyMessage="No USGS data available for this well."
      errorMessage="Error fetching USGS info."
      isLoading={query.isLoading}
      isError={query.isError}
    />
  )
}
