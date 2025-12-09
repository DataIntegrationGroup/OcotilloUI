import Grid from '@mui/material/Grid2'
import MapComponent from '@/components/MapComponent'

interface MapPolygonComponentProps {
  mapRef: any
  polygon: any
  setPolygon: (arg0: any) => void
}

export const MapPolygonComponent: React.FC<MapPolygonComponentProps> = ({
  mapRef,
  polygon,
  setPolygon,
}) => {
  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={12}>
        <MapComponent
          mapRef={mapRef}
          style={{ height: '600px', width: '100%' }}
          initialViewState={{
            longitude: -106.4,
            latitude: 34.5,
            zoom: 6,
          }}
          setSelectionPolygons={setPolygon}
        />
      </Grid>
    </Grid>
  )
}
