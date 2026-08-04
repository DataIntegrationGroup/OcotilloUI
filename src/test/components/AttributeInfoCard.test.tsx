// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AttributeInfoCard } from '@/components/card/AttributeInfoCard'

const sections = [
  {
    title: 'Water right',
    items: [
      {
        label: 'Status',
        value: 'Permit',
        description: 'The current status of a water right',
      },
      {
        label: 'NMWRRS water right summary',
        value: 'Open report',
        href: 'https://nmwrrs.ose.nm.gov/report',
      },
    ],
  },
]

const rawRows = [
  {
    id: 0,
    field: 'status',
    label: 'Status',
    value: 'Permit',
    description: 'The current status of a water right',
  },
]

const renderCard = (
  props: Partial<Parameters<typeof AttributeInfoCard>[0]> = {}
) =>
  render(
    <AttributeInfoCard
      icon={null}
      title="OSE POD Information"
      sections={sections}
      rawRows={rawRows}
      emptyMessage="No OSE POD data available for this well."
      errorMessage="Error fetching OSE POD info."
      isLoading={false}
      isError={false}
      {...props}
    />
  )

describe('AttributeInfoCard', () => {
  it('shows the consolidated summary by default', () => {
    renderCard()

    expect(screen.getByText('Water right')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Permit')).toBeInTheDocument()
  })

  it('renders link items as external links', () => {
    renderCard()

    expect(screen.getByRole('link', { name: 'Open report' })).toHaveAttribute(
      'href',
      'https://nmwrrs.ose.nm.gov/report'
    )
  })

  it('swaps the summary for the raw attribute table on request', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole('button', { name: 'Raw attributes' }))

    expect(screen.queryByText('Water right')).toBeNull()
    expect(screen.getByRole('button', { name: 'Summary' })).toBeInTheDocument()
  })

  it('hides the toggle when there is nothing to show', () => {
    renderCard({ sections: [], rawRows: [] })

    expect(screen.queryByRole('button', { name: 'Raw attributes' })).toBeNull()
    expect(
      screen.getByText('No OSE POD data available for this well.')
    ).toBeInTheDocument()
  })

  it('shows the error message instead of the empty message when the query failed', () => {
    renderCard({ sections: [], rawRows: [], isError: true })

    expect(screen.getByText('Error fetching OSE POD info.')).toBeInTheDocument()
    expect(
      screen.queryByText('No OSE POD data available for this well.')
    ).toBeNull()
  })

  it('shows neither message while loading', () => {
    renderCard({ sections: [], rawRows: [], isLoading: true })

    expect(
      screen.queryByText('No OSE POD data available for this well.')
    ).toBeNull()
    expect(screen.queryByText('Error fetching OSE POD info.')).toBeNull()
  })
})
