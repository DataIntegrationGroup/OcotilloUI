import { pdf } from '@react-pdf/renderer'
import { useGo, useNotification } from '@refinedev/core'
import { FileTextIcon, Loader2Icon, UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
// Imported by path, not through '@/components': that barrel re-exports
// ContactShow, so going through it puts this module in a cycle with the table
// that renders it, and the cell reads as undefined at render time.
import { FieldCompilationNotesPdf } from '@/components/pdf/FieldCompilationNotesPdf'
import { Button } from '@/components/ui/button'
import { useAccessCapabilities, useWellPdfData } from '@/hooks'
import type { AssociatedSiteRow } from '@/hooks/useAssociatedSiteRows'
import { buildPdfFilename } from '@/utils'

/**
 * Per-row report actions for the associated-sites table.
 *
 * Field builds the well's field sheet here, so the reader does not lose the
 * contact page to fetch one. Owner hands off to the chemistry report exporter,
 * which owns the year picker and section toggles.
 *
 * A field sheet needs the well's full payload — observations, assets,
 * contacts, sensors, sample — so the fetch is armed by the click rather than
 * on mount. Arming on mount would pull all of that for every row on the page.
 */
export const AssociatedSiteReportActions = ({
  row,
}: {
  row: AssociatedSiteRow
}) => {
  const go = useGo()
  const { open: notify } = useNotification()
  const { canManageAmp, canViewConfidential } = useAccessCapabilities()

  const [armed, setArmed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const generatedFor = useRef<string | null>(null)

  const { well, observations, assets, contacts, sensorDeployments, isLoading } =
    useWellPdfData({ thingId: armed ? row.id : undefined })

  useEffect(() => {
    if (!armed || isLoading || !well?.id) return
    // The effect re-runs as each underlying query settles; the ref keeps one
    // click from producing several downloads.
    if (generatedFor.current === String(row.id)) return
    generatedFor.current = String(row.id)

    const generate = async () => {
      setIsGenerating(true)
      try {
        const filename = buildPdfFilename(well)
        // Same renderer the bulk field-sheet export uses, so a sheet pulled
        // from here matches one pulled from a batch run. standalone defaults
        // true, which wraps this single well in its own document.
        const blob = await pdf(
          <FieldCompilationNotesPdf
            well={well}
            contacts={contacts}
            assets={assets}
            observations={observations}
            sensorDeployments={sensorDeployments}
            includeConfidentialContacts={canViewConfidential}
          />
        ).toBlob()

        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename.endsWith('.pdf')
          ? filename
          : `${filename}.pdf`
        anchor.click()
        URL.revokeObjectURL(url)

        notify?.({
          message: 'PDF generated successfully',
          type: 'success',
          description: anchor.download,
        })
      } catch (error) {
        console.error(error)
        notify?.({ message: 'PDF Generation Failed', type: 'error' })
      } finally {
        setIsGenerating(false)
        setArmed(false)
        generatedFor.current = null
      }
    }

    generate()
  }, [
    armed,
    isLoading,
    well,
    assets,
    contacts,
    observations,
    sensorDeployments,
    canViewConfidential,
    notify,
    row.id,
  ])

  const isBusy = armed || isGenerating
  const disabled = !canManageAmp || isBusy

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={!canManageAmp}
        onClick={(event) => {
          // The row is a link; a report action is not navigation.
          event.stopPropagation()
          go({
            to: '/ocotillo/chemistry-report',
            query: { thing_id: row.id },
            type: 'push',
          })
        }}
      >
        <UserIcon />
        Owner
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          setArmed(true)
        }}
      >
        {isBusy ? <Loader2Icon className="animate-spin" /> : <FileTextIcon />}
        Field
      </Button>
    </div>
  )
}
