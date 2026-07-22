import type { PropsWithChildren } from 'react'
import { Document } from '@react-pdf/renderer'

type OcotilloDocumentProps = PropsWithChildren<{
  title?: string | null
  subject?: string | null
}>

export const OcotilloDocument = ({
  title = null,
  subject = null,
  children,
}: OcotilloDocumentProps) => {
  return (
    <Document
      title={title ?? undefined}
      author="NMBGMR Ocotillo"
      creator="NMBGMR Ocotillo System"
      language="en-US"
      subject={subject ?? undefined}
    >
      {children}
    </Document>
  )
}
