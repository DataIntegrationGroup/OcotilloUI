// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CSV_PAGE_SIZE,
  fetchInternalCollectionCsv,
  INTERNAL_PATH_PREFIX,
  InternalCollectionsPanel,
} from '@/components/InternalCollectionsPanel'

const { fetcherMock } = vi.hoisted(() => ({ fetcherMock: vi.fn() }))

vi.mock('@/providers/ocotillo-data-provider', () => ({
  fetcher: (...args: unknown[]) => fetcherMock(...args),
}))

const itemsResponse = (features: unknown[], numberMatched?: number) => ({
  data: { type: 'FeatureCollection', features, numberMatched },
})

const feature = (name: string) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-106.886838, 32.097592] },
  properties: { name },
})

const featurePage = (count: number, start = 0) =>
  Array.from({ length: count }, (_row, index) =>
    feature(`Well ${start + index}`)
  )

const collections = [
  {
    id: 'staff_only_wells',
    title: 'Staff Only Wells',
    description: 'Wells withheld from the public service.',
  },
  { id: 'draft_chemistry', title: 'Draft Chemistry' },
  // No title and no id anywhere: the catalogue is not consistent about these.
  { collection_id: 'legacy_import' },
]

// jsdom has no object URLs and will not follow a download, so the anchor the
// component builds is observed rather than exercised.
const createObjectURL = vi.fn((_blob: Blob) => 'blob:internal-csv')
const revokeObjectURL = vi.fn()
const anchorClick = vi.fn()
let downloadedFilename: string | undefined

beforeEach(() => {
  fetcherMock.mockReset()
  createObjectURL.mockClear()
  revokeObjectURL.mockClear()
  anchorClick.mockClear()
  downloadedFilename = undefined

  URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
  URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL

  const createElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
    const element = createElement(tagName, options)
    if (tagName === 'a') {
      const anchor = element as HTMLAnchorElement
      anchor.click = () => {
        downloadedFilename = anchor.download
        anchorClick()
      }
    }
    return element
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const rowFor = (title: string) =>
  screen.getByText(title).closest('tr') as HTMLElement

const renderPanel = (
  props: Partial<Parameters<typeof InternalCollectionsPanel>[0]> = {}
) => {
  const onOpenSchema = vi.fn()

  render(
    <InternalCollectionsPanel
      collections={collections}
      isLoading={false}
      isError={false}
      error={undefined}
      onOpenSchema={onOpenSchema}
      {...props}
    />
  )

  return { onOpenSchema }
}

describe('InternalCollectionsPanel', () => {
  it('lists every collection sorted by title', () => {
    renderPanel()

    const titles = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)

    expect(titles).toEqual([
      'Draft Chemistry',
      'legacy_import',
      'Staff Only Wells',
    ])
  })

  it('asks the internal mount for the schema', async () => {
    const { onOpenSchema } = renderPanel()
    const user = userEvent.setup()

    await user.click(
      within(rowFor('Staff Only Wells')).getByRole('button', {
        name: /schema/i,
      })
    )

    expect(onOpenSchema).toHaveBeenCalledWith({
      collectionId: 'staff_only_wells',
      title: 'Staff Only Wells',
      pathPrefix: INTERNAL_PATH_PREFIX,
    })
  })

  it('exports a CSV off the internal mount', async () => {
    fetcherMock.mockResolvedValue(itemsResponse([feature('Well A')], 1))
    renderPanel()
    const user = userEvent.setup()

    await user.click(
      within(rowFor('Staff Only Wells')).getByRole('button', { name: /csv/i })
    )

    expect(fetcherMock).toHaveBeenCalledWith(
      `${INTERNAL_PATH_PREFIX}/collections/staff_only_wells/items`,
      { params: { f: 'json', limit: CSV_PAGE_SIZE, offset: 0 } }
    )
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(anchorClick).toHaveBeenCalledOnce()

    // jsdom's Blob has no text(), so the document itself is asserted on
    // fetchInternalCollectionCsv below rather than read back out of the blob.
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/csv;charset=utf-8')
  })

  it('names the file after the collection', async () => {
    fetcherMock.mockResolvedValue(itemsResponse([feature('Well A')], 1))
    renderPanel()
    const user = userEvent.setup()

    await user.click(
      within(rowFor('Staff Only Wells')).getByRole('button', { name: /csv/i })
    )

    expect(downloadedFilename).toBe('staff-only-wells.csv')
  })

  it('warns when part of the export failed to load', async () => {
    fetcherMock
      .mockResolvedValueOnce(itemsResponse(featurePage(CSV_PAGE_SIZE), 5000))
      .mockRejectedValueOnce(new Error('502 Bad Gateway'))
    renderPanel()
    const user = userEvent.setup()

    await user.click(
      within(rowFor('Staff Only Wells')).getByRole('button', { name: /csv/i })
    )

    // The rows that arrived still download; the warning says it is short.
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /failed to load/i
    )
  })

  it('says so instead of saving an empty file', async () => {
    fetcherMock.mockResolvedValue(itemsResponse([], 0))
    renderPanel()
    const user = userEvent.setup()

    await user.click(
      within(rowFor('Staff Only Wells')).getByRole('button', { name: /csv/i })
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no records to export/i
    )
    expect(anchorClick).not.toHaveBeenCalled()
  })

  it('reports an export that fails', async () => {
    fetcherMock.mockRejectedValue(new Error('403 Forbidden'))
    renderPanel()
    const user = userEvent.setup()

    await user.click(
      within(rowFor('Staff Only Wells')).getByRole('button', { name: /csv/i })
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('403 Forbidden')
    expect(anchorClick).not.toHaveBeenCalled()
  })

  it('says so when the mount publishes nothing', () => {
    renderPanel({ collections: [] })

    expect(screen.getByText(/published no collections/i)).toBeInTheDocument()
  })

  it('surfaces the failure message', () => {
    renderPanel({ isError: true, error: new Error('403 Forbidden') })

    expect(screen.getByRole('alert')).toHaveTextContent('403 Forbidden')
  })

  it('shows a spinner while loading', () => {
    renderPanel({ isLoading: true, collections: [] })

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})

describe('fetchInternalCollectionCsv', () => {
  it('renders the features as CSV, coordinates included', async () => {
    fetcherMock.mockResolvedValue(
      itemsResponse([feature('Well A'), feature('Well B')], 2)
    )

    const { csv, count, partial } =
      await fetchInternalCollectionCsv('staff_only_wells')

    expect(fetcherMock).toHaveBeenCalledWith(
      `${INTERNAL_PATH_PREFIX}/collections/staff_only_wells/items`,
      { params: { f: 'json', limit: CSV_PAGE_SIZE, offset: 0 } }
    )
    expect(count).toBe(2)
    expect(partial).toBe(false)
    expect(csv.split('\n')).toHaveLength(3)
    expect(csv).toContain('Well A')
    expect(csv).toContain('Well B')
    // The reason this is rendered here rather than by the API's f=csv.
    expect(csv).toContain('longitude')
    expect(csv).toContain('-106.886838')
  })

  it('pages until the server runs out of records', async () => {
    fetcherMock
      .mockResolvedValueOnce(itemsResponse(featurePage(CSV_PAGE_SIZE), 1500))
      .mockResolvedValueOnce(
        itemsResponse(featurePage(500, CSV_PAGE_SIZE), 1500)
      )

    const { count, partial } =
      await fetchInternalCollectionCsv('staff_only_wells')

    expect(fetcherMock).toHaveBeenCalledTimes(2)
    expect(fetcherMock.mock.calls[1][1]).toEqual({
      params: { f: 'json', limit: CSV_PAGE_SIZE, offset: CSV_PAGE_SIZE },
    })
    expect(count).toBe(1500)
    expect(partial).toBe(false)
  })

  it('exports a collection far larger than one page, whole', async () => {
    // No record cap: 25 full pages then a short one, all of it in the file.
    for (let page = 0; page < 25; page += 1) {
      fetcherMock.mockResolvedValueOnce(
        itemsResponse(featurePage(CSV_PAGE_SIZE, page * CSV_PAGE_SIZE), 25400)
      )
    }
    fetcherMock.mockResolvedValueOnce(
      itemsResponse(featurePage(400, 25 * CSV_PAGE_SIZE), 25400)
    )

    const { count, partial } =
      await fetchInternalCollectionCsv('staff_only_wells')

    expect(count).toBe(25400)
    expect(partial).toBe(false)
  })

  it('reports a partial export when a page fails midway', async () => {
    fetcherMock
      .mockResolvedValueOnce(itemsResponse(featurePage(CSV_PAGE_SIZE), 5000))
      .mockRejectedValueOnce(new Error('502 Bad Gateway'))

    const { count, partial } =
      await fetchInternalCollectionCsv('staff_only_wells')

    // The rows that arrived are still worth saving; the caller warns.
    expect(count).toBe(CSV_PAGE_SIZE)
    expect(partial).toBe(true)
  })

  it('keeps records that have no geometry', async () => {
    // The map drops these; a CSV of a non-spatial view still wants every row.
    fetcherMock.mockResolvedValue(
      itemsResponse(
        [{ type: 'Feature', geometry: null, properties: { name: 'Well A' } }],
        1
      )
    )

    const { csv, count } =
      await fetchInternalCollectionCsv('water_well_summary')

    expect(count).toBe(1)
    expect(csv).toContain('Well A')
  })

  it('reports nothing for a collection with no records', async () => {
    fetcherMock.mockResolvedValue(itemsResponse([], 0))

    const { count, partial } = await fetchInternalCollectionCsv(
      'actively_monitored_wells'
    )

    expect(count).toBe(0)
    expect(partial).toBe(false)
  })

  it('rethrows a rejected request rather than returning an empty file', async () => {
    fetcherMock.mockRejectedValue(new Error('403 Forbidden'))

    await expect(
      fetchInternalCollectionCsv('staff_only_wells')
    ).rejects.toThrow('403 Forbidden')
  })
})
