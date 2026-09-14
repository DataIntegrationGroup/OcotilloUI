import { pdf } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { ChemistryReportPdf } from '@/components/pdf/chemistry/ChemistryReportPdf'
import type { ChemistryResult } from '@/hooks/useChemistryReportData'
import type { IWell } from '@/interfaces/ocotillo'
import type { WaterLevelReading } from '@/utils/chemistryReport'

/**
 * The report is rendered for real and read back, rather than asserted against
 * the component tree: the reviewer comments these cover are about what a well
 * owner sees on the page, and a string that never reaches the PDF -- because
 * its section did not render, or a stat was dropped -- would still pass a
 * shallow assertion.
 */
const renderReportText = async (
  element: React.ReactElement
): Promise<string> => {
  const blob = await pdf(element).toBlob()
  const data = new Uint8Array(await blob.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data }).promise

  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    pages.push(
      textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    )
  }

  // Labels are uppercased by the stylesheet, so comparisons are made in one
  // case. Whitespace is collapsed because react-pdf breaks a line wherever it
  // needs to.
  return pages.join('\n').replace(/\s+/g, ' ').toLowerCase()
}

/**
 * The same text with every space removed. The masthead and the section
 * headings are letter-spaced, which pdf.js reads back as one item per glyph,
 * so those strings can only be matched with the spacing taken out of both
 * sides.
 */
const dense = (text: string) => text.replace(/ /g, '')

/** Stands in for the encoded QR, which the masthead only renders when given one. */
const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII='

const makeWell = (overrides: Partial<IWell> = {}): IWell =>
  ({
    id: 1,
    name: 'WL-1187',
    site_name: 'Vigil Ranch Well',
    thing_type: 'water-well',
    location_id: 1,
    created_at: '2026-01-01T00:00:00Z',
    release_status: 'public',
    alternate_ids: [],
    well_depth: 385,
    well_depth_unit: 'ft',
    well_casing_diameter: 6,
    well_casing_diameter_unit: 'in',
    current_location: {
      properties: { county: 'Socorro', elevation: 4712 },
      geometry: { coordinates: [-106.9412, 34.1234] },
    },
    ...overrides,
  }) as unknown as IWell

const makeResult = (
  overrides: Partial<ChemistryResult> = {}
): ChemistryResult =>
  ({
    id: 'r1',
    thing_id: 1,
    sample_id: 900,
    parameter_name: 'Arsenic',
    value: 0.012,
    unit: 'mg/L',
    observation_datetime: '2026-05-15T00:00:00Z',
    result_kind: 'minor',
    ...overrides,
  }) as ChemistryResult

const makeReading = (
  overrides: Partial<WaterLevelReading> = {}
): WaterLevelReading => ({
  key: 'wl-1',
  measuredOn: '2026-02-04T00:00:00Z',
  depthToWaterFt: 208.4,
  depthReference: 'ground surface',
  waterElevationFt: 4503.6,
  method: 'Steel tape',
  isPrior: false,
  ...overrides,
})

describe('ChemistryReportPdf — reviewer comments', () => {
  it('names the report and the program the way the bureau does', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        year={2026}
      />
    )

    expect(text).toContain('water quality report')
    expect(text).not.toContain('annual water quality report')
    expect(dense(text)).toContain(
      dense('aquifer mapping and monitoring program')
    )
  })

  it('labels well facts in the reader’s terms', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        year={2026}
      />
    )

    expect(text).toContain('nmbgmr well point id')
    expect(text).toContain('casing diameter')
    expect(text).toContain('4,712 ft above sea level')
    expect(text).not.toContain('amsl')
  })

  it('gives an email to write to and no phone number at all', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        year={2026}
      />
    )

    expect(text).toContain('aquifermapping@nmt.edu')
    expect(text).not.toContain('835-5327')
    // The Drinking Water Bureau is still named as somewhere to turn after an
    // exceedance; only its number is gone.
    expect(text).toContain('drinking water bureau')
    expect(text).not.toContain('476-8620')
  })

  it('reports an exceedance without explaining why the constituent is there', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        year={2026}
      />
    )

    expect(text).toContain('above a federal health limit')
    expect(text).not.toContain('occurs naturally')
  })

  it('calls a secondary exceedance a recommended range, not an SMCL', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          makeResult({
            id: 'r2',
            parameter_name: 'Chloride',
            value: 400,
          }),
        ]}
        year={2026}
      />
    )

    expect(text).toContain('above recommended range')
    expect(text).not.toContain('above smcl')
  })

  it('leaves the ion balance out of the glossary', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        year={2026}
      />
    )

    expect(text).not.toContain('ion balance')
  })

  it('drops the water level change stat when there is nothing to compare', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        waterLevels={[makeReading()]}
        year={2026}
      />
    )

    expect(text).not.toContain('water level change')
    expect(text).not.toContain('needs two readings')
  })

  it('prints the change beside the readings when there are two', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        waterLevels={[
          makeReading(),
          makeReading({
            key: 'wl-0',
            measuredOn: '2025-08-15T00:00:00Z',
            depthToWaterFt: 207.5,
            waterElevationFt: 4504.5,
            isPrior: true,
          }),
        ]}
        year={2026}
      />
    )

    expect(text).toContain('water level change')
    // Depth grew from 207.5 to 208.4 ft, so the water level fell 0.9 ft.
    expect(text).toContain('-0.9 ft since aug 15, 2025')
  })

  it('scopes the year to the water levels, not to the chemistry', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        // Sampled seven years before the reporting year, and still reported.
        observations={[
          makeResult({ observation_datetime: '2019-04-09T00:00:00Z' }),
        ]}
        waterLevels={[makeReading()]}
        year={2026}
      />
    )

    expect(text).toContain('apr 09, 2019')
    expect(text).toContain('the chemistry is every result on record')
    expect(text).toContain('water level measurements cover 2026')
    expect(text).toContain('samples on record')
    expect(text).not.toContain('samples this year')
    expect(text).not.toContain('2026 calendar year')
  })

  it('names Weaver under the QR code, so the destination is not a guess', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        year={2026}
        qrCodeDataUrl={PIXEL_PNG}
      />
    )

    expect(text).toContain('weaver')
    // Ocotillo is the internal admin app; the code must not send an owner there.
    expect(text).not.toContain('ocotillo')
  })

  it('gives the MCL and the SMCL a column each, filled only where they apply', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          makeResult({ id: 'a', parameter_name: 'Arsenic', value: 0.012 }),
          makeResult({ id: 'b', parameter_name: 'Chloride', value: 310 }),
        ]}
        year={2026}
      />
    )

    expect(dense(text)).toContain(dense('maximum contaminant level'))
    expect(dense(text)).toContain(dense('secondary maximum contaminant level'))
    // The vague pairing SS objected to is gone.
    expect(dense(text)).not.toContain(dense('standard type'))
  })

  it('plots each result against its own limit and nothing else', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          // 0.012 against an MCL of 0.01.
          makeResult({ id: 'a', parameter_name: 'Arsenic', value: 0.012 }),
          // 2.4 against an MCL of 4.
          makeResult({ id: 'b', parameter_name: 'Fluoride', value: 2.4 }),
        ]}
        year={2026}
      />
    )

    expect(text).toContain('1.2x the limit')
    expect(text).toContain('0.60x the limit')
    expect(text).toContain(
      'nothing here compares your well with any other well'
    )
    expect(text).not.toContain('nearby')
    expect(text).not.toContain('percentile')
  })

  it('leaves the comparison blank for a parameter with no standard', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          makeResult({
            id: 'h',
            parameter_name: 'Hardness (CaCO3)',
            value: 210,
          }),
        ]}
        year={2026}
      />
    )

    // Classified, not scored against a limit it does not have.
    expect(text).toContain('very hard')
    expect(text).not.toContain('x the limit')
  })

  it('omits well facts that are not on file rather than printing a dash', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell({
          well_depth: null,
          well_casing_diameter: null,
          site_name: null,
        } as Partial<IWell>)}
        observations={[makeResult()]}
        year={2026}
      />
    )

    expect(text).toContain('nmbgmr well point id')
    expect(text).not.toContain('total depth')
    expect(text).not.toContain('casing diameter')
    expect(text).not.toContain('site name')
  })
})
