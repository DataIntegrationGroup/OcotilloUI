import { useMemo } from 'react'
import { BaseRecord } from '@refinedev/core'
import { Page, Text, Image } from '@react-pdf/renderer'
import { IPdfDensity, IPdfOptions } from '@/interfaces'
import { IObservation, IContact, IWell, ISample } from '@/interfaces/ocotillo'
import {
  buildPdfFilename,
  createPdfStyles,
  sanitizeContacts,
  SensorDeploymentRow,
} from '@/utils'
import { PDF_DEFAULT_VALUES } from '@/config'
import { useAllNotes } from '@/hooks/useAllNotes'
import { useMostRecentObservation } from '@/hooks/useMostRecentObservation'
import { usePrimaryAndSecondaryContact } from '@/hooks/usePrimaryAndSecondaryContact'
import {
  AdditionalInformation,
  CoreInformation,
  ContactInformation,
  ImageGallery,
  WellInformation,
  SensorDeploymentTable,
} from '@/components/pdf'
import { Footer, Header, LineItem } from '@/components/pdf/layout'
import { OcotilloDocument } from './OcotilloDocument'

export const WellPDF = ({
  well,
  sample = {},
  assets,
  contacts,
  observations,
  options = {},
  sensorDeployments = [],
  hydrographImage,
  standalone = true,
  includeConfidentialContacts = true,
}: {
  well: IWell
  sample?: Partial<ISample>
  assets: BaseRecord[]
  contacts: IContact[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments?: SensorDeploymentRow[]
  options?: IPdfOptions
  hydrographImage?: string | null
  standalone?: boolean
  includeConfidentialContacts?: boolean
}) => {
  const density: IPdfDensity =
    options.density ?? PDF_DEFAULT_VALUES.density ?? 'standard'
  const isDense = density === 'standard' || density === 'compact'
  const styles = useMemo(() => createPdfStyles(density), [density])
  const filename = useMemo(() => buildPdfFilename(well), [well?.id])
  const visibleContacts = useMemo(
    () => sanitizeContacts(contacts, includeConfidentialContacts),
    [contacts, includeConfidentialContacts]
  )
  const showAdditionalOnFirstPage = density === 'compact'

  const mostRecentObservation = useMostRecentObservation(observations)
  const mostRecent = mostRecentObservation ?? {}
  const { primaryContact, secondaryContact } =
    usePrimaryAndSecondaryContact(visibleContacts)
  const allNotes = useAllNotes(well, options)

  const pages = (
    <>
      <Page size="A4" style={styles.page}>
        <Header styles={styles} />
        <CoreInformation well={well} styles={styles} dense={isDense} />
        <ContactInformation
          primaryContact={primaryContact}
          secondaryContact={secondaryContact}
          styles={styles}
          dense={isDense}
        />
        <WellInformation
          well={well}
          mostRecent={mostRecent}
          sample={sample}
          styles={styles}
          dense={isDense}
          opts={options}
        />
        {allNotes.map((section) => (
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
          <>
            <SensorDeploymentTable rows={sensorDeployments} styles={styles} />
            <AdditionalInformation
              well={well}
              styles={styles}
              dense={isDense}
              opts={options}
            />
          </>
        )}
        {showAdditionalOnFirstPage && options.includeHydrograph !== false && (
          <>
            <Text style={styles.title}>Hydrograph</Text>
            {hydrographImage ? (
              <Image
                src={hydrographImage}
                style={{
                  width: '100%',
                  height: 220,
                  objectFit: 'contain',
                  marginTop: 6,
                  marginBottom: 10,
                }}
              />
            ) : (
              <Text style={styles.pageNote}>(Hydrograph unavailable)</Text>
            )}
          </>
        )}
        {showAdditionalOnFirstPage &&
          assets.length > 0 &&
          options.includeAssets !== false && (
            <ImageGallery assets={assets} styles={styles} />
          )}
        <Footer wellId={well?.name} styles={styles} />
      </Page>
      {!showAdditionalOnFirstPage && (
        <Page size="A4" style={styles.page}>
          <Header styles={styles} />
          <SensorDeploymentTable rows={sensorDeployments} styles={styles} />
          <AdditionalInformation
            well={well}
            styles={styles}
            dense={isDense}
            opts={options}
          />
          {assets.length > 0 && options.includeAssets !== false && (
            <ImageGallery assets={assets} styles={styles} />
          )}
          <Footer wellId={well?.name} styles={styles} />
        </Page>
      )}
      {options.includeHydrograph ? (
        <Page size="A4" style={styles.page}>
          <Header styles={styles} />
          <Text style={styles.title}>Hydrograph</Text>
          {hydrographImage ? (
            <Image
              src={hydrographImage}
              style={{
                width: '100%',
                height: 220,
                objectFit: 'contain',
                marginTop: 6,
                marginBottom: 10,
              }}
            />
          ) : (
            <Text style={styles.pageNote}>(Hydrograph unavailable)</Text>
          )}
          <Footer wellId={well?.name} styles={styles} />
        </Page>
      ) : null}
      {options.includeBlankPage ? (
        <Page size="A4" style={styles.page}>
          <Header styles={styles} />
          <Text style={styles.pageNote}>(Page intentionally left blank)</Text>
          <Footer wellId={well?.name} styles={styles} />
        </Page>
      ) : null}
    </>
  )

  if (!standalone) {
    return pages
  }

  return (
    <OcotilloDocument title={filename || null} subject="Well Field Data Report">
      {pages}
    </OcotilloDocument>
  )
}
