import { useNotification } from '@refinedev/core'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import {
  type ChemistryReportSections,
  downloadChemistryReport,
} from '@/components/pdf/chemistry'
import { Button } from '@/components/ui/button'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'

export const ChemistryReportDownloadButton = ({
  well,
  contacts,
  observations,
  year,
  sections,
  disabled = false,
}: {
  well?: IWell
  contacts: readonly IContact[]
  observations: readonly ChemistryObservation[]
  year: number
  sections: ChemistryReportSections
  disabled?: boolean
}) => {
  const { open: notify } = useNotification()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!well) return

    try {
      setIsGenerating(true)
      const filename = await downloadChemistryReport({
        well,
        contacts,
        observations,
        year,
        sections,
      })

      notify?.({
        message: 'Chemistry report generated',
        type: 'success',
        description: filename,
      })
    } catch (error) {
      console.error(error)
      notify?.({
        message: 'Chemistry report generation failed',
        type: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || !well || isGenerating}
      onClick={handleDownload}
    >
      <DownloadIcon />
      {isGenerating ? 'Generating…' : 'Download PDF'}
    </Button>
  )
}
