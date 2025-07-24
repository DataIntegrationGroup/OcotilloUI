import React from 'react'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useDataProvider, useList, useOne } from '@refinedev/core'

export const MapView: React.FC = () => {
  const { data, isLoading } = useOne({
    dataProviderName: 'dataforge',
    resource: 'geospatial',
    id: 'feature-collection',
    queryOptions: {
      cacheTime: 60000, // Cache for 1 minute
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
    meta: {
      requestConfig: {
        params: {
          type: 'water well',
        },
      },
    },
  })

  return (
    <MapComponent
      isLoading={isLoading}
      showDrawControls={{ show: true, position: 'top-right' }}
      // setSelectionPolygons={setSelectionPolygons}
      // setPopupContent={setPopupContent}
      // popupContent={popupContent}
      // onMouseMoveCallback={onMouseMove}
    >
      <Source
        key="foo"
        id="foo"
        type="geojson"
        data={data?.data || { type: 'FeatureCollection', features: [] }}
      >
        <Layer
          id="location"
          type="circle"
          paint={{
            'circle-radius': 6,
            'circle-color': '#B42222',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
          }}
        />
      </Source>
    </MapComponent>
  )
}
