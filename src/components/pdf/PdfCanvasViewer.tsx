/**
 * Canvas-based PDF renderer wrapper.
 *
 * Replaces @react-pdf/renderer's PDFViewer (iframe-based, broken in headless
 * Chromium) with a pdf.js canvas renderer via react-pdf. The PDF is generated
 * client-side using @react-pdf/renderer and rendered in canvas so it works in
 * headless environments.
 *
 * Usage:
 *   <PdfCanvasViewer>
 *     <FieldCompilationNotesPdf {...props} />
 *   </PdfCanvasViewer>
 *
 * Note: The pdf.js worker URL is patched globally by the `patchPdfWorker` Vite
 * plugin (vite.config.ts) which replaces react-pdf's internal bare specifier
 * with a CDN URL before any module evaluates.
 */

import { pdf } from '@react-pdf/renderer'
import { Document as PdfDocument, Page } from 'react-pdf'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ReactElement } from 'react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface PdfCanvasViewerProps {
  children: ReactElement
  width?: number
  height?: number
  /** Called when PDF is ready (e.g. for loading state management) */
  onLoadSuccess?: (name: string) => void
  /** Error callback */
  onLoadError?: (error: Error) => void
}

/**
 * Canvas-based PDF viewer.
 *
 * Generates a PDF from React elements using @react-pdf/renderer, converts it
 * to a blob URL, then renders it in canvas using react-pdf (pdf.js). This
 * approach works in headless Chromium where PDFViewer's iframe rendering fails.
 */
export const PdfCanvasViewer = ({
  children,
  width,
  height,
  onLoadSuccess,
  onLoadError,
}: PdfCanvasViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [error, setError] = useState<Error | null>(null)
  const generatorRef = useRef(false)

  const generatePdf = useCallback(() => {
    if (!children || generatorRef.current) return

    generatorRef.current = true
    try {
      const doc = pdf(children)
      doc.toBlob().then((blob) => {
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      }).catch((err) => {
        console.error('PDF generation failed:', err)
        setError(err)
      })
    } catch (err) {
      console.error('PDF generation error:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [children])

  useEffect(() => {
    generatePdf()
  }, [generatePdf])

  function onDocumentLoadSuccess({ numPages: n }: { numPages: number }) {
    setNumPages(n)
    if (onLoadSuccess) onLoadSuccess('PdfCanvasViewer')
  }

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fee',
          color: '#c00',
          padding: 16,
        }}
      >
        PDF Error: {error.message}
      </div>
    )
  }

  if (!pdfUrl) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
        }}
      >
        Generating PDF…
      </div>
    )
  }

  return (
    <div
      style={{
        width: width || '100%',
        height: height || '100%',
      }}
    >
      <PdfDocument
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(e) => {
          console.error('PDF loading error:', e)
          if (onLoadError) onLoadError(e as Error)
        }}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={width || undefined}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        ))}
      </PdfDocument>
    </div>
  )
}
