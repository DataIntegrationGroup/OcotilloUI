import { useMemo } from 'react'
import { BaseRecord } from '@refinedev/core'
import { Document, Page, Text, Image } from '@react-pdf/renderer'
import { IPdfDensity, IPdfOptions } from '@/interfaces'
import { IObservation, IContact, IWell, ISample } from '@/interfaces/ocotillo'
import { buildPdfFilename, createPdfStyles, SensorDeploymentRow } from '@/utils'
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
  SensorDeploymentTable,
} from '@/components/pdf'
import { Footer, Header, LineItem } from '@/components/pdf/layout'

export const WellPDF = ({
  well,
  sample,
  assets,
  contacts,
  observations,
  options = {},
  sensorDeployments,
  hydrographImage,
}: {
  well: IWell
  sample: ISample
  assets: BaseRecord[]
  contacts: IContact[]
  observations: readonly Partial<IObservation>[]
  sensorDeployments: SensorDeploymentRow[]
  options: IPdfOptions
  hydrographImage?: string | null
}) => {
  const density: IPdfDensity = options.density ?? PDF_DEFAULT_VALUES.density
  const isDense = density === 'dense' || density === 'very-dense'
  const styles = useMemo(() => createPdfStyles(density), [density])
  const filename = useMemo(() => buildPdfFilename(well), [well?.id])
  const showAdditionalOnFirstPage = density === 'very-dense'

  const mostRecentObservation = useMostRecentObservation(observations)
  const { primaryContact, secondaryContact } =
    usePrimaryAndSecondaryContact(contacts)
  const allNotes = useAllNotes(well, options)

  return (
    <Document
      title={filename || null}
      author="NMBGMR Ocotillo"
      creator="NMBGMR Ocotillo System"
      language="en-US"
      subject="Well Field Data Report"
    >
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
          mostRecent={mostRecentObservation}
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
                  height: 220, // tune this
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
                height: 220, // tune this
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
    </Document>
  )
}
