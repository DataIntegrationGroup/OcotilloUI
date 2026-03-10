import { useGo, usePermissions } from '@refinedev/core'
import { useParams } from 'react-router'
import { Button } from '@mui/material'
import { Visibility } from '@mui/icons-material'

export const WellPDFPreviewButton = ({ isLoading }: { isLoading: boolean }) => {
  const go = useGo()
  const { id } = useParams()
  const { data: permissions, isLoading: isPermissionsLoading } =
    usePermissions<string[]>({})

  const isViewer = permissions?.includes('AMPViewer') ?? false

  const disabled = isLoading || isPermissionsLoading || !isViewer

  const handlePreview = () => {
    go({ to: `/ocotillo/well/pdf-preview/${id}`, type: 'push' })
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
