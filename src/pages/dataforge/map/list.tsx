import { ShowButton, EditButton, List, useDataGrid } from '@refinedev/mui'
import React from 'react'

import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import { ListPage } from '@/components/ListPage'
import { Layer, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'

export const MapView: React.FC = () => {
  return (
    <MapComponent
      // isLoading={isLoading}
      showDrawControls={{ show: true, position: 'top-right' }}
      // setSelectionPolygons={setSelectionPolygons}
      // setPopupContent={setPopupContent}
      // popupContent={popupContent}
      // onMouseMoveCallback={onMouseMove}
    ></MapComponent>
  )
}
