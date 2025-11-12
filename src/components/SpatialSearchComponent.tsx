import React, { useRef, useState } from 'react'
import { Button, Modal } from '@mui/material'
import wellknown from 'wellknown'
import { Place } from '@mui/icons-material'
import { Box } from '@mui/system'
import MapComponent from '@/components/MapComponent'
import { MapRef } from 'react-map-gl'
import Grid from '@mui/material/Grid2'

interface SpatialSearchComponentProps {
  setSpatialSearchWKT: (wkt: string | null) => void
}

export const SpatialSearchComponent: React.FC<SpatialSearchComponentProps> = ({
  setSpatialSearchWKT,
}) => {
  const [spatialSearchOpen, setSpatialSearchOpen] = useState(false)
  const [selectionPolygons, setSelectionPolygons] = useState({})
  const mapRef = useRef<MapRef>(null)

  const handlePolygonSearch = () => {
    if (Object.keys(selectionPolygons).length === 0) {
      console.warn('No selection polygons to process')
      return
    }

    const polygon = Object.values(selectionPolygons)[0]
    const wktString = wellknown.stringify(polygon)
    setSpatialSearchWKT(wktString)
    setSelectionPolygons({})
  }
  const handleMapExtentSearch = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      const bounds = map.getBounds()
      const wktString = wellknown.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
            [bounds.getWest(), bounds.getNorth()],
            [bounds.getWest(), bounds.getSouth()],
          ],
        ],
      })
      setSpatialSearchWKT(wktString)
    }
  }
  const handleClear = () => {
    setSelectionPolygons({})
    setSpatialSearchWKT(null)
  }

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '50%',
    backgroundColor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  }

  const initialViewState = {
    longitude: -106.4,
    latitude: 34.5,
    zoom: 6,
  }

  return (
    <>
      <Grid spacing={2} container>
        <Button
          variant="contained"
          size="small"
          onClick={() => setSpatialSearchOpen(true)}
        >
          <Place />
          Spatial Search
        </Button>
        <Button variant="contained" size="small" onClick={handleClear}>
          Clear
        </Button>
      </Grid>
      <Modal open={spatialSearchOpen}>
        <Box sx={modalStyle}>
          <MapComponent
            mapRef={mapRef}
            style={{ height: '700px', width: '100%' }}
            initialViewState={initialViewState}
            setSelectionPolygons={setSelectionPolygons}
          ></MapComponent>

          <Grid container spacing={2} sx={{ marginTop: 2 }}>
            <Grid size={9}>
              <Button
                sx={{ marginRight: 1 }}
                variant="contained"
                onClick={() => {
                  handlePolygonSearch()
                  setSpatialSearchOpen(false)
                }}
              >
                Search
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleMapExtentSearch()
                  setSpatialSearchOpen(false)
                }}
              >
                Search Map Extent
              </Button>
            </Grid>
            <Grid size={3}>
              <Button
                variant="outlined"
                onClick={() => setSpatialSearchOpen(false)}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  )
}
