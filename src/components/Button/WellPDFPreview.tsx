import { usePermissions, useNavigation } from '@refinedev/core'
import { useParams } from 'react-router-dom'
import { Button } from '@mui/material'
import { Visibility } from '@mui/icons-material'

export const WellPDFPreviewButton = ({ isLoading }: { isLoading: boolean }) => {
  const { push } = useNavigation()
  const { id } = useParams()
  const { data: permissions, isLoading: isPermissionsLoading } =
    usePermissions<string[]>()

  const isViewer = permissions?.includes('AMPViewer') ?? false

  const disabled = isLoading || isPermissionsLoading || !isViewer

  const handlePreview = () => {
    push(`/ocotillo/well/pdf-preview/${id}`)
  }

  return (
    <Button
      color="primary"
      disabled={disabled}
      startIcon={<Visibility />}
      onClick={handlePreview}
      sx={{ pl: 3, pr: 2 }}
    >
      Preview PDF
    </Button>
  )
}
