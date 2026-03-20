import { useGo } from '@refinedev/core'
import { useParams } from 'react-router'
import { Button } from '@mui/material'
import { Visibility } from '@mui/icons-material'
import { useAccessCapabilities } from '@/hooks'

export const WellPDFPreviewButton = ({ isLoading }: { isLoading: boolean }) => {
  const go = useGo()
  const { id } = useParams()
  const { isLoading: isPermissionsLoading, canViewAmp } = useAccessCapabilities()

  const disabled = isLoading || isPermissionsLoading || !canViewAmp

  const handlePreview = () => {
    go({ to: `/ocotillo/well/pdf-preview/${id}`, type: 'push' })
  }

  return (
    <Button
      color="primary"
      disabled={disabled}
      startIcon={<Visibility />}
      onClick={handlePreview}
      sx={{ pl: 1, pr: 1 }}
    >
      Preview PDF
    </Button>
  )
}
