import React, { useEffect, useState, useRef } from 'react'
import Box from '@mui/material/Box'
import { useForm } from '@refinedev/react-hook-form'
import { HttpError } from '@refinedev/core'
import { IGroundwaterLevelForm } from '@/interfaces/dataforge/IGroundwaterLevel'
import { Create, useAutocomplete } from '@refinedev/mui'
import TextField from '@mui/material/TextField'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import Autocomplete from '@mui/material/Autocomplete'
import { IThing } from '@/interfaces/dataforge/IThing'
import { ISeries } from '@/interfaces/dataforge/ISeries'
import { ILexicon } from '@/interfaces/dataforge/ILexicon'
import { ISensor } from '@/interfaces/dataforge/ISensor'
import dayjs from 'dayjs'

import { MapComponent } from '@/components'
import { Layer, Source } from 'react-map-gl'
import { MapRef } from 'react-map-gl'
import { Button, Stack } from '@mui/material'
import { MapOutlined } from '@mui/icons-material'

export const GroundwaterLevelForm: React.FC = () => {
  const {
    control,
    // refineCore: { onFinish, formLoading, query },
    register,
    // handleSubmit,
    formState: { errors },
    saveButtonProps,
  } = useForm<IGroundwaterLevelForm, HttpError, IGroundwaterLevelForm>({
    refineCoreProps: {
      resource: 'observation/groundwater-level',
      dataProviderName: 'dataforge',
      // action: 'edit',
      // id: 123,
    },
    defaultValues: {
      measuring_point_height: 1,
      depth_to_water: 123,
      observation_timestamp: new Date(),
      series_id: 1,
    },
  })

  const { autocompleteProps: autocompletePropsReleaseStatus } =
    useAutocomplete<ILexicon>({
      resource: 'lexicon',
      dataProviderName: 'dataforge',
      meta: {
        params: { category: 'release_status' },
      },
    })

  const { autocompleteProps: autocompletePropsThing } = useAutocomplete<IThing>(
    {
      resource: 'thing',
      dataProviderName: 'dataforge',
      onSearch: (value) => [
        {
          field: 'name',
          operator: 'contains',
          value,
        },
      ],
    }
  )

  const [selectedThingID, setSelectedThingID] = useState<number | null>(null)
  const [selectedThingFeatureCollection, setSelectedThingFeatureCollection] =
    useState(null)
  const [displayMap, setDisplayMap] = useState(false)

  const { autocompleteProps: autocompletePropsSeries } =
    useAutocomplete<ISeries>({
      resource: 'series',
      dataProviderName: 'dataforge',
      meta: {
        params: {
          thing_id: selectedThingID,
          observed_property: 'groundwater level',
        },
      },
    })

  const { autocompleteProps: autocompletePropsLevelStatus } =
    useAutocomplete<ILexicon>({
      resource: 'lexicon',
      dataProviderName: 'dataforge',
      meta: {
        params: { category: 'level_status' },
      },
    })

  const mapRef = useRef<MapRef>(null)
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
          zoom: 10, // adjust zoom as needed
          essential: true,
        })
      }
    }
  }, [selectedThingFeatureCollection, displayMap])

  const coords =
    selectedThingFeatureCollection?.features[0]?.geometry.coordinates
  const initialViewState = {
    longitude: coords ? coords[0] : -106.4,
    latitude: coords ? coords[1] : 34.5,
    zoom: 10,
  }

  const { autocompleteProps: autocompletePropsSensor } =
    useAutocomplete<ISensor>({
      resource: 'sensor',
      dataProviderName: 'dataforge',
      meta: {
        params: {
          thing_id: selectedThingID,
          observed_property: 'groundwater level',
        },
      },
    })

  return (
    <Create goBack={<></>} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <Stack direction="row" spacing={2}>
          <Box sx={{ flexGrow: 1 }}>
            <Controller
              name="thing_id"
              control={control}
              rules={{ required: 'This field is required' }}
              render={({ field }) => (
                <Autocomplete
                  {...autocompletePropsThing}
                  onChange={(_, newValue) => {
                    if (newValue === null) {
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
                    setSelectedThingID(newValue?.id || null)
                    field.onChange(newValue?.id || null)
                  }}
                  getOptionKey={(option) => option.id}
                  getOptionLabel={(option) =>
                    `${option.name}: (${option.id})` || ''
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Thing"
                      margin="normal"
                      error={!!errors.thing_id}
                      helperText={errors.thing_id?.message}
                    />
                  )}
                />
              )}
            />
          </Box>
          <Box sx={{ alignItems: 'center', display: 'flex' }}>
            <Button
              sx={{ height: '48px' }}
              variant="outlined"
              startIcon={<MapOutlined />}
              onClick={() => {
                setDisplayMap((prev) => !prev)
              }}
            />
          </Box>
        </Stack>

        <Box sx={{ paddingLeft: '50px', paddingRight: '50px' }}>
          {displayMap && (
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
          )}
        </Box>
        <Controller
          name="sensor_id"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...autocompletePropsSensor}
              disabled={selectedThingID === null}
              onChange={(_, newValue) => {
                field.onChange(newValue?.id || null)
              }}
              getOptionKey={(option) => option.id}
              getOptionLabel={(option) => option.name || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sensor"
                  margin="normal"
                  error={!!errors.sensor_id}
                  helperText={errors.sensor_id?.message}
                />
              )}
            />
          )}
        />
        <Controller
          name="series_id"
          control={control}
          rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompletePropsSeries}
              disabled={selectedThingID === null}
              onChange={(_, newValue) => {
                field.onChange(newValue?.id || null)
              }}
              getOptionKey={(option) => option.id}
              getOptionLabel={(option) => option.name || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Series"
                  margin="normal"
                  error={!!errors.series_id}
                  helperText={errors.series_id?.message}
                />
              )}
            />
          )}
        />

        <TextField
          {...register('depth_to_water')}
          error={!!errors.depth_to_water}
          helperText={errors.depth_to_water?.message}
          margin="normal"
          fullWidth
          label="Depth to Water (ft)"
          name="depth_to_water"
          type="number"
          autoFocus
        />
        <Controller
          name="observation_timestamp"
          control={control}
          render={({ field, fieldState }) => (
            <DateTimePicker
              {...field}
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => field.onChange(date ? date.toDate() : null)}
              label="Observation Timestamp"
              slotProps={{
                textField: {
                  margin: 'normal',
                  fullWidth: true,
                  error: !!errors.observation_timestamp,
                  helperText: errors.observation_timestamp?.message,
                },
              }}
            />
          )}
        />
        <TextField
          {...register('measuring_point_height')}
          error={!!errors.measuring_point_height}
          helperText={errors.measuring_point_height?.message}
          margin="normal"
          fullWidth
          label="Measuring Point Height (inches)"
          name="measuring_point_height"
          type="number"
          autoFocus
        />
        <Controller
          name="release_status"
          control={control}
          rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompletePropsReleaseStatus}
              onChange={(_, newValue) => {
                field.onChange(newValue?.term || null)
              }}
              getOptionKey={(option) => option.term}
              getOptionLabel={(option) => option.term || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Release Status"
                  margin="normal"
                  error={!!errors.release_status}
                  helperText={errors.release_status?.message}
                />
              )}
            />
          )}
        />
        <Controller
          name="level_status"
          control={control}
          rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompletePropsLevelStatus}
              onChange={(_, newValue) => {
                field.onChange(newValue?.term || null)
              }}
              getOptionKey={(option) => option.term}
              getOptionLabel={(option) => option.term || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Level Status"
                  margin="normal"
                  error={!!errors.level_status}
                  helperText={errors.level_status?.message}
                />
              )}
            />
          )}
        />
      </Box>
    </Create>
  )
}
