import { pdf } from '@react-pdf/renderer'
import { useNotification } from '@refinedev/core'
import { DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import {
  ChemistryReportPdf,
  type ChemistryReportSections,
} from '@/components/pdf/chemistry'
import { Button } from '@/components/ui/button'
import type { ChemistryObservation } from '@/hooks/useChemistryReportData'
import type { IContact, IWell } from '@/interfaces/ocotillo'
import { buildChemistryReportFilename } from '@/utils/chemistryReport'

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
      const filename = buildChemistryReportFilename(well, year)

      const blob = await pdf(
        <ChemistryReportPdf
          well={well}
          contacts={contacts}
          observations={observations}
          year={year}
          sections={sections}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)

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
