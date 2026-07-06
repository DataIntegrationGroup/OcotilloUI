// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAsset, IWell } from '@/interfaces/ocotillo'

const mockedMutateAsset = vi.fn()
const mockedNotify = vi.fn()

const wells: IWell[] = [
  {
    id: 1,
    name: 'Current Well',
    created_at: '2025-01-01',
    release_status: 'public',
    thing_type: 'water-well',
    location_id: 1,
  } as IWell,
  {
    id: 2,
    name: 'Replacement Well',
    created_at: '2025-01-01',
    release_status: 'public',
    thing_type: 'water-well',
    location_id: 2,
  } as IWell,
]

vi.mock('@refinedev/core', async () => {
  const actual =
    await vi.importActual<typeof import('@refinedev/core')>('@refinedev/core')

  return {
    ...actual,
    useCustomMutation: () => ({
      mutateAsync: mockedMutateAsset,
      mutation: { isPending: false },
    }),
    useNotification: () => ({ open: mockedNotify }),
  }
})

vi.mock('@refinedev/mui', () => ({
  useAutocomplete: () => ({
    autocompleteProps: {
      options: wells,
      loading: false,
    },
  }),
}))

import { AssetPreviewWithOverlay } from '@/components/WellShow/AssetPreviewWithOverlay'

const asset: IAsset = {
  id: 10,
  label: 'asset',
  name: 'field-photo.jpg',
  storage_path: 'field-photo.jpg',
  storage_service: 'test',
  created_at: new Date('2025-01-01'),
  release_status: 'public',
  mime_type: 'image/jpeg',
  size: 100,
  file: null,
  thing_id: 1,
  uri: 'test://field-photo.jpg',
  signed_url: 'https://example.com/field-photo.jpg',
}

describe('AssetPreviewWithOverlay reassociation dialog', () => {
  beforeEach(() => {
    mockedMutateAsset.mockReset()
    mockedNotify.mockReset()
    mockedMutateAsset.mockResolvedValue({})
  })

  it('selects a well from autocomplete without reassociating until the button is clicked', async () => {
    const user = userEvent.setup()
    const refetchAssets = vi.fn().mockResolvedValue({ data: { data: [asset] } })

    render(
      <AssetPreviewWithOverlay
        asset={asset}
        variant="slideshow"
        refetchAssets={refetchAssets}
        canManageAsset
      />
    )

    await user.click(screen.getByLabelText('Attachment actions for field-photo.jpg'))
    await user.click(screen.getByText('Reassociate attachment'))

    const dialog = screen.getByRole('dialog', {
      name: 'Reassociate attachment',
    })
    await user.click(within(dialog).getByLabelText('Well'))
    await user.click(screen.getByText('Replacement Well'))

    expect(
      screen.getByRole('dialog', { name: 'Reassociate attachment' })
    ).toBeTruthy()
    expect(mockedMutateAsset).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Reassociate' }))

    await waitFor(() => {
      expect(mockedMutateAsset).toHaveBeenCalledWith({
        url: 'asset/10/association',
        method: 'patch',
        values: { thing_id: 2 },
        dataProviderName: 'ocotillo',
      })
    })
  })

  it('selects a highlighted well with Enter without closing the dialog', async () => {
    const user = userEvent.setup()
    const refetchAssets = vi.fn().mockResolvedValue({ data: { data: [asset] } })

    render(
      <AssetPreviewWithOverlay
        asset={asset}
        variant="slideshow"
        refetchAssets={refetchAssets}
        canManageAsset
      />
    )

    await user.click(screen.getByLabelText('Attachment actions for field-photo.jpg'))
    await user.click(screen.getByText('Reassociate attachment'))

    const dialog = screen.getByRole('dialog', {
      name: 'Reassociate attachment',
    })
    const wellInput = within(dialog).getByLabelText('Well')

    await user.click(wellInput)
    await user.keyboard('{ArrowDown}{Enter}')

    expect(
      screen.getByRole('dialog', { name: 'Reassociate attachment' })
    ).toBeTruthy()
    expect(
      within(dialog).getByRole<HTMLButtonElement>('button', {
        name: 'Reassociate',
      }).disabled
    ).toBe(false)
    expect(mockedMutateAsset).not.toHaveBeenCalled()
  })

  it('shows the asset name in grid mode with a view more action', async () => {
    const user = userEvent.setup()
    const refetchAssets = vi.fn().mockResolvedValue({ data: { data: [asset] } })
    const onViewMore = vi.fn()

    render(
      <AssetPreviewWithOverlay
        asset={{ ...asset, label: 'Field inspection photo label' }}
        variant="grid"
        refetchAssets={refetchAssets}
        onViewMore={onViewMore}
      />
    )

    expect(screen.getByText('field-photo.jpg')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'View more' }))

    expect(onViewMore).toHaveBeenCalledTimes(1)
  })

  it('shows the asset label in slideshow mode', () => {
    const refetchAssets = vi.fn().mockResolvedValue({ data: { data: [asset] } })

    render(
      <AssetPreviewWithOverlay
        asset={{ ...asset, label: 'Expanded slideshow label' }}
        variant="slideshow"
        refetchAssets={refetchAssets}
      />
    )

    expect(screen.getByText('Expanded slideshow label')).toBeTruthy()
  })

  it('updates the asset label from slideshow mode', async () => {
    const user = userEvent.setup()
    const refetchAssets = vi.fn().mockResolvedValue({ data: { data: [asset] } })

    render(
      <AssetPreviewWithOverlay
        asset={{ ...asset, label: 'Original label' }}
        variant="slideshow"
        refetchAssets={refetchAssets}
        canManageAsset
      />
    )

    await user.click(screen.getByLabelText('Attachment actions for field-photo.jpg'))
    await user.click(screen.getByText('Edit label'))

    const dialog = screen.getByRole('dialog', {
      name: 'Edit attachment label',
    })
    const labelInput = within(dialog).getByLabelText('Label')

    await user.clear(labelInput)
    await user.type(labelInput, 'Updated field label')
    await user.click(within(dialog).getByRole('button', { name: 'Save label' }))

    await waitFor(() => {
      expect(mockedMutateAsset).toHaveBeenCalledWith({
        url: 'asset/10',
        method: 'patch',
        values: { label: 'Updated field label' },
        dataProviderName: 'ocotillo',
      })
    })
    expect(refetchAssets).toHaveBeenCalled()
  })

  it('does not offer label editing in grid mode', async () => {
    const user = userEvent.setup()
    const refetchAssets = vi.fn().mockResolvedValue({ data: { data: [asset] } })

    render(
      <AssetPreviewWithOverlay
        asset={asset}
        variant="grid"
        refetchAssets={refetchAssets}
        canManageAsset
      />
    )

    await user.click(screen.getByLabelText('Attachment actions for field-photo.jpg'))

    expect(screen.queryByText('Edit label')).toBeNull()
  })

  it('shows the slideshow caption in the footer', () => {
    const refetchAssets = vi.fn().mockResolvedValue({ data: { data: [asset] } })

    render(
      <AssetPreviewWithOverlay
        asset={asset}
        variant="slideshow"
        refetchAssets={refetchAssets}
        slideshowCaption="2 / 5"
      />
    )

    expect(screen.getByText('2 / 5')).toBeTruthy()
  })
})
