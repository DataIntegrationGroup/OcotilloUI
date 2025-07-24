import { ShowButton, EditButton, List, useDataGrid } from '@refinedev/mui'
import React from 'react'

import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import { ListPage } from '@/components/ListPage'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useDataProvider, useList, useOne } from '@refinedev/core'

export const MapView: React.FC = () => {
  const { data, isLoading } = useOne({
    dataProviderName: 'dataforge',
    resource: 'geospatial',
    id: 'feature-collection',
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
