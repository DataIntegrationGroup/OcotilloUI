// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KeyValueInfoCard } from '@/components/card/KeyValueInfoCard'

const renderCard = (
  props: Partial<Parameters<typeof KeyValueInfoCard>[0]> = {}
) =>
  render(
    <KeyValueInfoCard
      icon={null}
      title="USGS Information"
      linkLabel="Water Services API"
      emptyMessage="No USGS data available for this well."
      errorMessage="Error fetching USGS info."
      rows={[]}
      isLoading={false}
      isError={false}
      {...props}
    />
  )

describe('KeyValueInfoCard', () => {
  it('shows the empty message when the query returned no rows', () => {
    renderCard()

    expect(
      screen.getByText('No USGS data available for this well.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Error fetching USGS info.')).toBeNull()
  })

  it('shows the error message instead of the empty message when the query failed', () => {
    renderCard({ rows: undefined, isError: true })

    expect(screen.getByText('Error fetching USGS info.')).toBeInTheDocument()
    expect(
      screen.queryByText('No USGS data available for this well.')
    ).toBeNull()
  })

  it('shows neither message while the query is loading', () => {
    renderCard({ rows: undefined, isLoading: true })

    expect(
      screen.queryByText('No USGS data available for this well.')
    ).toBeNull()
    expect(screen.queryByText('Error fetching USGS info.')).toBeNull()
  })

  it('keeps the card title visible in every state', () => {
    renderCard({ rows: undefined, isError: true })

    expect(screen.getByText('USGS Information')).toBeInTheDocument()
  })
})
