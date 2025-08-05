import { Box } from '@mui/system'
import { useAutocomplete } from '@refinedev/mui'
import { IThing } from '@/interfaces/dataforge/IThing'
import { Controller } from 'react-hook-form'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Layer, MapRef, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useEffect, useRef, useState } from 'react'
import { Button, Modal } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Place } from '@mui/icons-material'
import wellknown from 'wellknown'

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
  label = 'Select Thing',
}) => {
  const getOptionLabel = (option: any) => {
    return `${option.name}: (${option.id})`
  }
  const [spatialSearchOpen, setSpatialSearchOpen] = useState(false)
  const [selectionPolygons, setSelectionPolygons] = useState({})
  const [spatialSearchWKT, setSpatialSearchWKT] = useState(null)

  const { autocompleteProps: autocompletePropsThing } = useAutocomplete<IThing>(
    {
      resource: 'thing',
      dataProviderName: 'dataforge',
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
      queryOptions: {
        onSuccess: (data) => {
          console.log('Autocomplete options fetched:', data)

          updateMap(data?.data)
        },
      },
    }
  )

  const mapRef = useRef<MapRef>(null)
  const [selectedThingFeatureCollection, setSelectedThingFeatureCollection] =
    useState(null)

  // console.log(selectedThingFeatureCollection)
  const coords =
    selectedThingFeatureCollection?.features[0]?.geometry.coordinates
  const initialViewState = {
    longitude: coords ? coords[0] : -106.4,
    latitude: coords ? coords[1] : 34.5,
    zoom: 10,
  }

  const thing_id = watch('thing_id')
  useEffect(() => {
    let selectedThing = null
    if (thing_id) {
      selectedThing = autocompletePropsThing.options.find(
        (option: any) => option.id === thing_id
      )
      selectedThing = selectedThing ? [selectedThing] : undefined
    }
    updateMap(selectedThing)
  }, [thing_id])

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
  }, [selectedThingFeatureCollection])

  const updateMap = (newValue: IThing[] | undefined) => {
    console.log('update map', newValue)
    if (!newValue) {
      setSelectedThingFeatureCollection({
        type: 'FeatureCollection',
        features: [],
      })
    } else if (newValue[0]?.geometry === null) {
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
          geometry: item.geometry,
          properties: {
            name: item.name,
            id: item.id,
            thing_type: item.thing_type,
          },
        })),
        // features: [
        //   {
        //     type: 'Feature',
        //     id: newValue?.id || null,
        //     geometry: newValue?.geometry,
        //   },
        // ],
      })
    }
  }

  const handleSpatialSearch = () => {
    if (Object.keys(selectionPolygons).length === 0) {
      console.warn('No selection polygons to process')
      return
    }

    const polygon = Object.values(selectionPolygons)[0]
    const wktString = wellknown.stringify(polygon)
    setSpatialSearchWKT(wktString)
    setSelectionPolygons({})
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

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid size={3}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSpatialSearchOpen(true)}
          >
            <Place />
            Spatial Search
          </Button>
          <Modal open={spatialSearchOpen}>
            <Box sx={modalStyle}>
              <MapComponent
                style={{ height: '300px', width: '100%' }}
                mapRef={mapRef}
                initialViewState={initialViewState}
                setSelectionPolygons={setSelectionPolygons}
              ></MapComponent>
              <Button
                variant="contained"
                onClick={() => {
                  handleSpatialSearch()
                  setSpatialSearchOpen(false)
                }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSpatialSearchOpen(false)}
              >
                Close
              </Button>
            </Box>
          </Modal>
        </Grid>
        <Grid size={9}>
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
                onChange={(_, newValue) => {
                  updateMap([newValue])
                  field.onChange(newValue?.id || null)
                }}
                getOptionKey={(option) => option.id}
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

      <Box sx={{ paddingLeft: '50px', paddingRight: '50px' }}>
        <MapComponent
          style={{ height: '300px', width: '100%' }}
          mapRef={mapRef}
          initialViewState={initialViewState}
          showDrawControls={{ show: false }}
        >
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
    </Box>
  )
}
