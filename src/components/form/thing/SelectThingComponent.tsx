import { Box } from '@mui/system'
import { useAutocomplete } from '@refinedev/mui'
import { IThing } from '@/interfaces/ocotillo/IThing'
import { Controller } from 'react-hook-form'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Layer, LngLatBoundsLike, MapRef, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useEffect, useRef, useState } from 'react'
import { Card, Typography, useTheme } from '@mui/material'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'

import Grid from '@mui/material/Grid2'
import wellknown from 'wellknown'
import bbox from '@turf/bbox'
import { SpatialSearchComponent } from '@/components/SpatialSearchComponent'

interface EntryProps {
  control: any
  errors: any
  watch: any
  thing_type: string
  label?: string
}

export const SelectThingComponent: React.FC<EntryProps> = ({
  control,
  errors,
  watch,
  thing_type,
  label = 'Select Well',
}) => {
  const getOptionLabel = (option: any) => {
    return `${option.name}: (${option.id})`
  }

  const [spatialSearchWKT, setSpatialSearchWKT] = useState(null)
  const theme = useTheme()

  const { autocompleteProps: autocompletePropsThing } = useAutocomplete<IThing>(
    {
      resource: 'thing',
      dataProviderName: 'ocotillo',
      meta: {
        params: {
          thing_type: thing_type,
          within: spatialSearchWKT,
        },
      },
      onSearch: (value) => [
        {
          field: 'name',
          operator: 'contains',
          value,
        },
      ],
    }
  )

  useEffect(() => {
    updateMap(autocompletePropsThing.options)
  }, [autocompletePropsThing.options])

  const mapRef = useRef<MapRef>(null)
  const [selectedThingFeatureCollection, setSelectedThingFeatureCollection] =
    useState(null)
  const [tableRows, setTableRows] = useState([])
  const [initialViewState, setInitialViewState] = useState({
    longitude: -106.4,
    latitude: 34.5,
    zoom: 10,
  })

  // Set initial view state based on the first option's coordinates, if available
  useEffect(() => {
    if (!selectedThingFeatureCollection) return

    console.log(
      'selectedThingFeatureCollection',
      selectedThingFeatureCollection
    )
    const coords =
      selectedThingFeatureCollection?.features[0]?.geometry.coordinates
    const initialViewState = {
      longitude: coords ? coords[0] : -106.4,
      latitude: coords ? coords[1] : 34.5,
      zoom: 10,
    }
    setInitialViewState(initialViewState)
  }, [selectedThingFeatureCollection])

  const thing_id = watch('thing_id')
  useEffect(() => {
    let thing = null
    if (thing_id) {
      thing = autocompletePropsThing.options.find(
        (option: any) => option.id === thing_id
      )
    }

    const rows = [
      { name: 'Name', value: thing?.name || '' },
      { name: 'ID', value: thing?.id || '' },
      { name: 'Release Status', value: thing?.release_status || '' },
      { name: 'Thing Type', value: thing?.thing_type || '' },
      { name: 'Well Type', value: thing?.well_type || '' },
      { name: 'Well Depth (ft)', value: thing?.well_depth || '' },
      { name: 'Hole Depth (ft)', value: thing?.hole_depth || '' },
      { name: 'Location Name', value: thing?.active_location.name || '' },
      {
        name: 'Location Release Status',
        value: thing?.active_location.release_status || '',
      },
      { name: 'Created At', value: thing?.created_at },
      { name: 'Geometry Type', value: thing?.geometry?.type || '' },
      {
        name: 'Coordinates',
        value:
          JSON.stringify(thing?.active_location.geometry?.coordinates) || '',
      },
    ]

    setTableRows(rows)
    updateMap(thing ? [thing] : undefined)
  }, [thing_id])

  // Update the map view when the selected feature collection changes
  useEffect(() => {
    if (
      selectedThingFeatureCollection &&
      selectedThingFeatureCollection.features?.length > 0
    ) {
      const coords =
        selectedThingFeatureCollection.features[0].geometry.coordinates

      if (coords && mapRef.current) {
        mapRef.current.flyTo({
          center: coords,
          zoom: 13, // adjust zoom as needed
          essential: true,
          animate: false,
        })
      }
    }

    if (spatialSearchWKT) {
      const polygon = wellknown.parse(spatialSearchWKT)
      if (polygon && mapRef.current) {
        // Create a bounding box from the polygon
        const bounds = bbox(polygon)
        console.log('bounds', bounds)
        mapRef.current.fitBounds(bounds as LngLatBoundsLike, {
          padding: 20,
          maxZoom: 10,
          animate: false,
          essential: true,
        })
      }
    }
  }, [selectedThingFeatureCollection, spatialSearchWKT])

  const updateMap = (newValue: readonly IThing[] | undefined) => {
    console.log('updateMap', newValue)
    if (!newValue) {
      setSelectedThingFeatureCollection({
        type: 'FeatureCollection',
        features: [],
      })
    } else if (newValue[0]?.current_location === null) {
      setSelectedThingFeatureCollection({
        type: 'FeatureCollection',
        features: [],
      })
    } else {
      setSelectedThingFeatureCollection({
        type: 'FeatureCollection',
        features: newValue.map((item) => ({
          type: 'Feature',
          id: item.id,
          geometry: item.current_location.geometry,
          properties: {
            name: item.name,
            id: item.id,
            thing_type: item.thing_type,
          },
        })),
      })
    }
  }

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid size={4}>
          <SpatialSearchComponent setSpatialSearchWKT={setSpatialSearchWKT} />
        </Grid>
        <Grid size={8}>
          <Controller
            name="thing_id"
            control={control}
            rules={{ required: 'This field is required' }}
            render={({ field }) => (
              <Autocomplete
                {...autocompletePropsThing}
                value={
                  autocompletePropsThing.options.find(
                    (option: any) => option.id === field.value
                  ) || null
                }
                onChange={(_, newValue: any) => {
                  field.onChange(newValue?.id || null)
                }}
                getOptionKey={(option: any) => option.id}
                getOptionLabel={getOptionLabel}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={label}
                    margin="normal"
                    error={!!errors.thing_id}
                    helperText={errors.thing_id?.message}
                  />
                )}
              />
            )}
          />
        </Grid>
      </Grid>
      <Grid container spacing={1} sx={{ paddingTop: '10px' }}>
        <Grid size={8}>
          <Box sx={{ paddingLeft: '5px', paddingRight: '5px' }}>
            <MapComponent
              style={{ height: '500px', width: '100%' }}
              mapRef={mapRef}
              initialViewState={initialViewState}
              showDrawControls={{ show: false }}
            >
              <Source
                key="spatialSearchPolygon"
                id="spatialSearchPolygon"
                type="geojson"
                data={
                  spatialSearchWKT
                    ? {
                        type: 'FeatureCollection',
                        features: [
                          {
                            type: 'Feature',
                            geometry: wellknown.parse(spatialSearchWKT),
                          },
                        ],
                      }
                    : { type: 'FeatureCollection', features: [] }
                }
              >
                <Layer
                  type={'fill'}
                  id={'spatialSearchPolygon'}
                  paint={{
                    'fill-color': theme.palette.primary.main,
                    'fill-opacity': 0.2,
                  }}
                />
              </Source>
              <Source
                key="selectedThing"
                id="selectedThing"
                type="geojson"
                data={selectedThingFeatureCollection}
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
          </Box>
        </Grid>
        <Grid size={4}>
          <Card sx={{ height: '100%', padding: 2 }}>
            <Typography variant="h6">Well Details</Typography>
            <TableContainer>
              <Table size={'small'}>
                <TableBody>
                  {tableRows?.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell component="th" scope="row">
                        <strong>{row.name}</strong>
                      </TableCell>
                      <TableCell align="right">{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
