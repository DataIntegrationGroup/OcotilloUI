import { useGo } from '@refinedev/core'
import { useParams } from 'react-router'
import { EyeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccessCapabilities } from '@/hooks'

export const WellPDFPreviewButton = ({ isLoading }: { isLoading: boolean }) => {
  const go = useGo()
  const { id } = useParams()
  const { isLoading: isPermissionsLoading, canManageAmp } =
    useAccessCapabilities()

  const disabled = isLoading || isPermissionsLoading || !canManageAmp

  const handlePreview = () => {
    go({ to: `/ocotillo/well/pdf-preview/${id}`, type: 'push' })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handlePreview}
    >
      <EyeIcon />
      Preview PDF
    </Button>
  )
}
