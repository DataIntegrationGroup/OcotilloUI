import { useMemo } from 'react'
import { BaseRecord } from '@refinedev/core'
import { Document, Page, Text } from '@react-pdf/renderer'
import { IPdfDensity, IPdfOptions } from '@/interfaces'
import { IObservation, IContact, IWell } from '@/interfaces/ocotillo'
import { buildPdfFilename, createPdfStyles } from '@/utils'
import { PDF_DEFAULT_VALUES } from '@/config'
import {
  useAllNotes,
  useMostRecentObservation,
  usePrimaryAndSecondaryContact,
} from '@/hooks'
import {
  AdditionalInformation,
  CoreInformation,
  ContactInformation,
  ImageGallery,
  WellInformation,
} from '@/components/pdf'
import { Footer, LineItem } from '@/components/pdf/layout'

export const WellPDF = ({
  well,
  assets,
  contacts,
  observations,
  options = {},
}: {
  well: IWell
  assets: BaseRecord[]
  contacts: IContact[]
  observations: readonly Partial<IObservation>[]
  options: IPdfOptions
}) => {
  const density: IPdfDensity = options.density ?? PDF_DEFAULT_VALUES.density
  const styles = useMemo(() => createPdfStyles(density), [density])
  const filename = useMemo(() => buildPdfFilename(well), [well?.id])
  const showAdditionalOnFirstPage = density === 'very-dense'

  const mostRecentObservation = useMostRecentObservation(observations)
  const { primaryContact, secondaryContact } =
    usePrimaryAndSecondaryContact(contacts)
  const allNotes = useAllNotes(well)

  return (
    <Document
      title={filename || null}
      author="NMBGMR Ocotillo"
      creator="NMBGMR Ocotillo System"
      language="en-US"
      subject="Well Field Data Report"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Field Compilation Notes</Text>
        <CoreInformation well={well} styles={styles} />
        {options.includeContacts && (
          <ContactInformation
            primaryContact={primaryContact}
            secondaryContact={secondaryContact}
            styles={styles}
          />
        )}
        <WellInformation
          well={well}
          mostRecent={mostRecentObservation}
          styles={styles}
        />
        {options.includeNotes &&
          allNotes.map((section) => (
            <LineItem
              key={section.title}
              title={
                section.title.toLowerCase().endsWith('notes')
                  ? section.title
                  : `${section.title} Notes`
              }
              value={section.value ?? undefined}
              styles={styles}
            />
          ))}
        {assets.length === 0 && options.includeAssets !== false && (
          <Text style={styles.pageNote}>
            (No images are associated with this well)
          </Text>
        )}
        {showAdditionalOnFirstPage && (
          <AdditionalInformation well={well} styles={styles} />
        )}
        <Footer wellId={well?.name} styles={styles} />
      </Page>
      {!showAdditionalOnFirstPage && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Field Compilation Notes</Text>
          <AdditionalInformation well={well} styles={styles} />
          <Footer wellId={well?.name} styles={styles} />
        </Page>
      )}
      {assets.length > 0 && options.includeAssets !== false && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Field Compilation Notes</Text>
          <ImageGallery assets={assets} styles={styles} />
          <Footer wellId={well?.name} styles={styles} />
        </Page>
      )}
      {options.includeBlankPage ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Field Compilation Notes</Text>
          <Text style={styles.pageNote}>(Page intentionally left blank)</Text>
          <Footer wellId={well?.name} styles={styles} />
        </Page>
      ) : null}
    </Document>
  )
}
