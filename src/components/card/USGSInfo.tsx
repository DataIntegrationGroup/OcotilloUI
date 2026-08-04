import { Public } from '@mui/icons-material'
import { useUSGSSiteInfo } from '@/hooks'
import { KeyValueInfoCard } from './KeyValueInfoCard'

type USGSInfoCardProps = {
  site_id: string
}

export const USGSInfoCard = ({ site_id }: USGSInfoCardProps) => {
  const query = useUSGSSiteInfo(site_id)

  return (
    <KeyValueInfoCard
      icon={<Public color="primary" />}
      title="USGS Information"
      linkLabel="Water Services API"
      emptyMessage="No USGS data available for this well."
      errorMessage="Error fetching USGS info."
      rows={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
    />
  )
}
