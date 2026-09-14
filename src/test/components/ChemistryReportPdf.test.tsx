import { pdf } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import {
  CHEMISTRY_REPORT_DEFAULT_SECTIONS,
  ChemistryReportPdf,
} from '@/components/pdf/chemistry/ChemistryReportPdf'
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
 * The same text, one entry per page, for assertions about where things land.
 * Built separately from `renderReportText`, whose whitespace collapsing turns
 * the page breaks into ordinary spaces.
 */
const renderReportPages = async (
  element: React.ReactElement
): Promise<string[]> => {
  const blob = await pdf(element).toBlob()
  const data = new Uint8Array(await blob.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data }).promise

  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    pages.push(
      textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .toLowerCase()
    )
  }

  return pages
}

/**
 * Every text run on the page, as pdf.js hands them back.
 *
 * Needed where the question is about layout rather than wording: a value that
 * wraps comes back as one run per line, while the flattened text of
 * `renderReportText` rejoins them with a space and looks identical either way.
 */
const renderReportRuns = async (
  element: React.ReactElement
): Promise<string[]> => {
  const blob = await pdf(element).toBlob()
  const data = new Uint8Array(await blob.arrayBuffer())
  const document = await pdfjsLib.getDocument({ data }).promise

  const runs: string[] = []
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) runs.push(item.str.trim())
    }
  }

  return runs
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

  it('keeps the change in the at-a-glance stat, not over the readings', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        sections={{ ...CHEMISTRY_REPORT_DEFAULT_SECTIONS, waterLevels: true }}
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

    // Depth grew from 207.5 to 208.4 ft, so the water level fell 0.9 ft.
    expect(text).toContain('water level change')
    expect(text).toContain('-0.9 ft')
    expect(text).toContain('vs. aug 15, 2025')
    // The section carries its heading and its table, and no summary line: the
    // dates are in the table and the change is already in the stat.
    expect(text).not.toContain('-0.9 ft since')
    expect(text).not.toContain('plus the last before it')
    expect(text).not.toContain('readings in 2026,')
  })

  it('names no year at all when no water level section is switched on', async () => {
    const pages = await renderReportPages(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          makeResult({ observation_datetime: '2019-04-09T00:00:00Z' }),
        ]}
        waterLevels={[makeReading()]}
        year={2026}
      />
    )
    const report = pages.join(' ')

    // Both water level sections are off by default, so the reporting year has
    // nothing left to scope and appears nowhere: not in the masthead, the
    // lede, or the running footer.
    expect(report).not.toContain('water levels for 2026')
    expect(report).not.toContain('water level measurements cover')
    expect(report).not.toContain('water quality report 2026')
    expect(report).not.toContain('water level change')
    expect(report).not.toContain('depth to water')
    // The sample's own date is chemistry, and stays.
    expect(report).toContain('apr 09, 2019')
  })

  it('names the year once a water level section is switched on', async () => {
    const pages = await renderReportPages(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        waterLevels={[
          makeReading(),
          makeReading({
            key: 'wl-0',
            measuredOn: '2025-08-15T00:00:00Z',
            depthToWaterFt: 207.5,
            isPrior: true,
          }),
        ]}
        sections={{ ...CHEMISTRY_REPORT_DEFAULT_SECTIONS, waterLevels: true }}
        year={2026}
      />
    )
    const report = pages.join(' ')

    expect(report).toContain('water levels for 2026')
    expect(report).toContain('water level measurements cover 2026')
    expect(report).toContain('water quality report 2026')
    expect(report).toContain('water level change')
    expect(report).toContain('depth to water')
  })

  it('scopes the year to the water levels, not to the chemistry', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        // Sampled seven years before the reporting year, and still reported.
        observations={[
          makeResult({ observation_datetime: '2019-04-09T00:00:00Z' }),
        ]}
        sections={{ ...CHEMISTRY_REPORT_DEFAULT_SECTIONS, waterLevels: true }}
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

  it('counts a persistent exceedance once, not once per sample', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          makeResult({
            id: 'feb',
            sample_id: 900,
            value: 0.012,
            observation_datetime: '2026-02-04T00:00:00Z',
          }),
          makeResult({
            id: 'may',
            sample_id: 901,
            value: 0.011,
            observation_datetime: '2026-05-15T00:00:00Z',
          }),
        ]}
        year={2026}
      />
    )

    expect(text).toContain('one result was above a federal health limit')
    expect(text).not.toContain('2 results were above a federal health limit')
    // Named once in the stat, at its most recent value in the callout.
    expect(text).not.toContain('arsenic, arsenic')
    expect(text).toContain('0.011 mg/l (limit 0.01 mg/l, sampled may 15, 2026)')
  })

  it('stops reporting a parameter that has since come back under its limit', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          makeResult({
            id: 'old',
            sample_id: 900,
            value: 0.012,
            observation_datetime: '2019-04-09T00:00:00Z',
          }),
          makeResult({
            id: 'new',
            sample_id: 901,
            value: 0.004,
            observation_datetime: '2026-05-15T00:00:00Z',
          }),
        ]}
        year={2026}
      />
    )

    expect(text).not.toContain('above a federal health limit')
    expect(text).toContain('below limit')
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

  it('starts the chemistry table on a page of its own', async () => {
    const pages = await renderReportPages(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        waterLevels={[makeReading()]}
        year={2026}
      />
    )

    // Section headings are letter-spaced, so they only match with the spacing
    // taken out of both sides.
    const chemistryPage = pages.findIndex((page) =>
      dense(page).includes(dense('water chemistry & drinking water standards'))
    )
    expect(chemistryPage).toBeGreaterThan(0)
    // Nothing from the sections above it shares the page.
    expect(dense(pages[chemistryPage])).not.toContain(dense('at a glance'))
    expect(dense(pages[chemistryPage])).not.toContain(
      dense('water level measurements')
    )
  })

  it('makes no claim about the parameters the table leaves out', async () => {
    const text = await renderReportText(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[
          makeResult({ id: 'a', parameter_name: 'Arsenic', value: 0.012 }),
          // No standard, so the table omits it.
          makeResult({ id: 'b', parameter_name: 'Strontium', value: 0.9 }),
          makeResult({ id: 'c', parameter_name: 'Boron', value: 0.3 }),
        ]}
        year={2026}
      />
    )

    expect(text).toContain('arsenic')
    expect(text).not.toContain('further parameter')
    expect(text).not.toContain('the full list is on file')
    expect(text).not.toContain('sampling visits')
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

  it('keeps a long stat value on one line instead of stranding its unit', async () => {
    const runs = await renderReportRuns(
      <ChemistryReportPdf
        well={makeWell()}
        observations={[makeResult()]}
        // Off by default, so the section it lives in has to be asked for.
        sections={{
          ...CHEMISTRY_REPORT_DEFAULT_SECTIONS,
          continuousMonitoring: true,
        }}
        continuous={{
          recordsInYear: 1107,
          recordsOnFile: 48211,
          periodOfRecord: ['2019-10-14T00:00:00Z', '2026-09-02T18:00:00Z'],
          firstInYear: {
            measuredOn: '2026-01-01T00:00:00Z',
            depthToWaterFt: 208.9,
          },
          lastInYear: {
            measuredOn: '2026-09-02T18:00:00Z',
            depthToWaterFt: 209.1,
          },
          shallowestInYear: {
            measuredOn: '2026-03-18T04:00:00Z',
            depthToWaterFt: 207.8,
          },
          deepestInYear: {
            measuredOn: '2026-07-29T16:00:00Z',
            depthToWaterFt: 210.4,
          },
          changeInYearFt: -0.2,
          provisional: false,
        }}
        year={2026}
      />
    )

    // One run, not two: at the display size this value wrapped and left "ft"
    // on a line of its own.
    expect(runs).toContain('207.8–210.4 ft')
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
