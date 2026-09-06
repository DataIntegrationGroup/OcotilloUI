// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  GisConnectionsPanel,
  GisLayerDownloads,
} from '@/components/GisArtifacts'
import { zGisCatalog } from '@/utils/gisArtifacts'

const catalog = zGisCatalog.parse({
  service_url: 'https://ocotillo-api.example.org/ogcapi',
  connections: [
    {
      client: 'qgis',
      href: 'https://ocotillo-api.example.org/gis/qgis/connections.xml',
      media_type: 'text/xml',
      filename: 'ocotillo-ogcapi-connections.xml',
    },
  ],
  layers: [
    {
      id: 'water-level-trend',
      title: 'Water-Level Trend',
      abstract: 'Direction of the fitted depth-to-water trend at each well.',
      collection: 'depth_to_water_trend_wells',
      collection_url:
        'https://ocotillo-api.example.org/ogcapi/collections/depth_to_water_trend_wells',
      geometry: 'Point',
      renderer: 'categorized',
      downloads: [
        {
          client: 'qgis',
          href: 'https://ocotillo-api.example.org/gis/qgis/layers/water-level-trend.qlr',
          media_type: 'text/xml',
          filename: 'water-level-trend.qlr',
        },
        {
          client: 'arcgis',
          href: 'https://ocotillo-api.example.org/gis/arcgis/layers/water-level-trend.lyrx',
          media_type: 'application/json',
          filename: 'water-level-trend.lyrx',
        },
      ],
    },
    {
      id: 'water-wells',
      title: 'Water Wells',
      collection: 'wells',
      geometry: 'Point',
      renderer: 'single',
      downloads: [
        {
          client: 'qgis',
          href: 'https://ocotillo-api.example.org/gis/qgis/layers/water-wells.qlr',
          media_type: 'text/xml',
          filename: 'water-wells.qlr',
        },
      ],
    },
  ],
})

describe('GisLayerDownloads', () => {
  it('renders one control per download, straight from the catalogue', () => {
    render(
      <>
        {catalog.layers.map((layer) => (
          <GisLayerDownloads key={layer.id} layer={layer} />
        ))}
      </>
    )

    // Two layers in the fixture: one with both clients, one QGIS-only.
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getAllByRole('link', { name: 'QGIS' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'ArcGIS Pro' })).toHaveLength(1)
  })

  it('carries the exact href and filename from the fixture', () => {
    render(<GisLayerDownloads layer={catalog.layers[0]} />)

    const qgis = screen.getByRole('link', { name: 'QGIS' })
    expect(qgis).toHaveAttribute(
      'href',
      'https://ocotillo-api.example.org/gis/qgis/layers/water-level-trend.qlr'
    )
    expect(qgis).toHaveAttribute('download', 'water-level-trend.qlr')

    const arcgis = screen.getByRole('link', { name: 'ArcGIS Pro' })
    expect(arcgis).toHaveAttribute(
      'href',
      'https://ocotillo-api.example.org/gis/arcgis/layers/water-level-trend.lyrx'
    )
    expect(arcgis).toHaveAttribute('download', 'water-level-trend.lyrx')
  })

  it('renders nothing for a layer with no downloads', () => {
    const { container } = render(
      <GisLayerDownloads layer={{ ...catalog.layers[1], downloads: [] }} />
    )

    expect(container).toBeEmptyDOMElement()
  })
})

describe('GisConnectionsPanel', () => {
  it('offers the connections file and the ArcGIS service URL', () => {
    render(<GisConnectionsPanel catalog={catalog} canViewInternal={false} />)

    const connections = screen.getByRole('link', {
      name: 'Download connections file',
    })
    expect(connections).toHaveAttribute(
      'href',
      'https://ocotillo-api.example.org/gis/qgis/connections.xml'
    )
    expect(connections).toHaveAttribute(
      'download',
      'ocotillo-ogcapi-connections.xml'
    )
    expect(
      screen.getByText('https://ocotillo-api.example.org/ogcapi')
    ).toBeInTheDocument()
  })

  it('hides the internal connections control without the viewer role', () => {
    render(<GisConnectionsPanel catalog={catalog} canViewInternal={false} />)

    expect(
      screen.queryByRole('button', { name: /internal/i })
    ).not.toBeInTheDocument()
  })

  it('shows the internal connections control with the viewer role', () => {
    render(<GisConnectionsPanel catalog={catalog} canViewInternal />)

    expect(
      screen.getByRole('button', { name: /internal/i })
    ).toBeInTheDocument()
  })
})
