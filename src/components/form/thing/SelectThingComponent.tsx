import { Box } from '@mui/system'
import { useAutocomplete } from '@refinedev/mui'
import { IThing } from '@/interfaces/dataforge/IThing'
import { Controller } from 'react-hook-form'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Layer, MapRef, Source } from 'react-map-gl'
import MapComponent from '@/components/MapComponent'
import { useEffect, useRef, useState } from 'react'

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

  const { autocompleteProps: autocompletePropsThing } = useAutocomplete<IThing>(
    {
      resource: 'thing',
      dataProviderName: 'dataforge',
      meta: {
        params: { thing_type: thing_type },
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

  const mapRef = useRef<MapRef>(null)
  const [selectedThingFeatureCollection, setSelectedThingFeatureCollection] =
    useState(null)

  console.log(selectedThingFeatureCollection)
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

  const updateMap = (newValue: IThing) => {
    console.log('update map', newValue)
    if (!newValue) {
      setSelectedThingFeatureCollection({
        type: 'FeatureCollection',
        features: [],
      })
    } else if (newValue?.geometry === null) {
      setSelectedThingFeatureCollection({
        type: 'FeatureCollection',
        features: [],
      })
    } else {
      setSelectedThingFeatureCollection({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: newValue?.id || null,
            geometry: newValue?.geometry,
          },
        ],
      })
    }
  }

  return (
    <Box>
      <Box sx={{ flexGrow: 1 }}>
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
                updateMap(newValue)
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
      </Box>
      <Box sx={{ paddingLeft: '50px', paddingRight: '50px' }}>
        <MapComponent mapRef={mapRef} initialViewState={initialViewState}>
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
