import { useGo, usePermissions } from '@refinedev/core'
import { useParams } from 'react-router'
import { Button } from '@mui/material'
import { Visibility } from '@mui/icons-material'
import { getAccessControlGroups } from '@/providers/authentik-provider'

export const WellPDFPreviewButton = ({ isLoading }: { isLoading: boolean }) => {
  const go = useGo()
  const { id } = useParams()
  const { data: permissions, isLoading: isPermissionsLoading } =
    usePermissions<string[]>({})
  const groups = getAccessControlGroups() ?? []

  const isViewer = permissions?.includes('AMPViewer') ?? groups.includes('AMPViewer')

  const disabled = !id || isPermissionsLoading || !isViewer

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
