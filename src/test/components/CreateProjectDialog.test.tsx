// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateProjectDialog } from '@/components/ProjectEdit/CreateProjectDialog'

const createMock = vi.fn()
const notifyMock = vi.fn()
const captureEventMock = vi.fn()

vi.mock('@/analytics/posthog', () => ({
  captureEvent: (...args: unknown[]) => captureEventMock(...args),
}))

vi.mock('@refinedev/core', () => ({
  useCreate: () => ({
    mutateAsync: createMock,
    mutation: { isPending: false },
  }),
  useNotification: () => ({ open: notifyMock }),
}))

const LEXICON: Record<string, { value: string; label: string }[]> = {
  release_status: [
    { value: 'draft', label: 'draft' },
    { value: 'public', label: 'public' },
  ],
  group_type: [
    { value: 'Monitoring Plan', label: 'Monitoring Plan' },
    { value: 'Historical', label: 'Historical' },
  ],
}

vi.mock('@/hooks', () => ({
  useLexicon: ({ category }: { category: string }) => ({
    options: LEXICON[category] ?? [],
    isLoading: false,
  }),
}))

const SQUARE_GEOJSON = JSON.stringify({
  type: 'Polygon',
  coordinates: [
    [
      [-106.5, 34.5],
      [-106.4, 34.5],
      [-106.4, 34.6],
      [-106.5, 34.6],
      [-106.5, 34.5],
    ],
  ],
})

const renderDialog = () => {
  const onOpenChange = vi.fn()
  const onCreated = vi.fn()
  render(
    <CreateProjectDialog
      open
      onOpenChange={onOpenChange}
      onCreated={onCreated}
    />
  )
  return { onOpenChange, onCreated }
}

const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Create project' }))

describe('CreateProjectDialog', () => {
  beforeEach(() => {
    createMock.mockReset()
    notifyMock.mockReset()
    captureEventMock.mockReset()
  })

  it('does not submit without a name', () => {
    renderDialog()

    submit()

    expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('posts the trimmed draft to the group resource', async () => {
    const created = { id: 42, name: 'Mesa Wells', created_at: '' }
    createMock.mockResolvedValue({ data: created })
    const { onOpenChange, onCreated } = renderDialog()

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '  Mesa Wells  ' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '   ' },
    })
    submit()

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created))
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'group',
        dataProviderName: 'ocotillo',
        values: {
          name: 'Mesa Wells',
          description: null,
          release_status: 'public',
          group_type: null,
          project_area: null,
        },
      })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' })
    )
  })

  it('sends an uploaded boundary as WKT', async () => {
    createMock.mockResolvedValue({ data: { id: 1, name: 'A', created_at: '' } })
    const { onCreated } = renderDialog()

    const file = new File([SQUARE_GEOJSON], 'area.geojson', {
      type: 'application/geo+json',
    })
    // jsdom's File has no text(); the dialog reads the upload through it.
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(SQUARE_GEOJSON),
    })
    fireEvent.change(screen.getByTestId('boundary-file-input'), {
      target: { files: [file] },
    })
    expect(await screen.findByText('area.geojson')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'A' },
    })
    submit()

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    const { values } = createMock.mock.calls[0][0]
    expect(values.project_area).toMatch(/POLYGON/)
  })

  it('reports a name collision and stays open', async () => {
    createMock.mockRejectedValue({ statusCode: 409 })
    const { onOpenChange, onCreated } = renderDialog()

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Taken' },
    })
    submit()

    await waitFor(() =>
      expect(notifyMock).toHaveBeenCalledWith({
        type: 'error',
        message: 'Another project already uses this name and type.',
      })
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(onCreated).not.toHaveBeenCalled()
  })
})
