import { 
    Control, 
    UseFormWatch, 
    UseFormSetValue, 
    FieldErrors,
} from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import {
  ControlledTextField,
  ControlledSelectField,
  MapComponent,
} from '@/components'
import { useLexicon } from '@/hooks'
import { useEffect, useRef, useState } from 'react'
import { MapRef, ViewState, Source, Layer } from 'react-map-gl'
import { Typography } from '@mui/material'
import wellknown from 'wellknown'

/**
 * CreateEditLocation Component
 * A reusable form component for creating and editing location information.
 * 
 * @param control - The control object from useForm
 * @param watch - The watch object from useForm
 * @param setValue - The setValue function from useForm
 * @param errors - The errors object from useForm
 * @param mode - The mode of the component ('standalone' or 'step')
 * @param fieldPrefix - The prefix for the field names
 */

interface CreateEditLocationProps {
  control: Control<any>
  watch?: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditLocation: React.FC<CreateEditLocationProps> = ({
  control,
  watch,
  setValue,
  errors,
  mode = 'standalone',
  fieldPrefix = ''
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 34.068279,
    longitude: -106.904192,
    zoom: 5,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, left: 0, right: 0, bottom: 0 },
  })

  //get release status options
  const { options: releaseStatusOptions, isLoading: releaseStatusLoading } = useLexicon({ 
    category: 'release_status' 
  })

  //auto-generate WKT point from latitude and longitude
  useEffect(() => {
    if (setValue && watch) {
      const lat = watch(getFieldName('latitude'))
      const lng = watch(getFieldName('longitude'))
      
      if (lat && lng) {
        setValue(getFieldName('point'), `POINT(${lng} ${lat})`)
      }
    }
  }, [setValue, fieldPrefix, watch(getFieldName('latitude')), watch(getFieldName('longitude'))])

  //get lat long from WKT point when edit location is loaded
  useEffect(() => {
    if (watch && setValue) {
      const point = watch(getFieldName('point'))
      
      if (point) {
        try {
          const geometry = wellknown.parse(point)
          if (geometry.type === 'Point' && geometry.coordinates) {
            const [lng, lat] = geometry.coordinates
            setValue(getFieldName('longitude'), lng)
            setValue(getFieldName('latitude'), lat)
            setViewState(prev => ({ ...prev, longitude: lng, latitude: lat }))
          }
        } catch (e) {
          console.error('Error parsing WKT point:', e)
        }
      }
    }
  }, [watch, setValue, fieldPrefix, watch(getFieldName('point'))])

  //update map when lat or long chnages
  useEffect(() => {
    if (watch) {
      const lat = watch(getFieldName('latitude'))
      const lng = watch(getFieldName('longitude'))
      
      if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        setViewState(prev => ({
          ...prev,
          longitude: Number(lng),
          latitude: Number(lat)
        }))
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [Number(lng), Number(lat)]
          })
        }
      }
    }
  }, [fieldPrefix, watch(getFieldName('latitude')), watch(getFieldName('longitude'))])

  //handle map click to set lat and long
  const handleMapClick = (e: any) => {
    if (setValue) {
      const { lng, lat } = e.lngLat
      setValue(getFieldName('longitude'), lng.toFixed(6))
      setValue(getFieldName('latitude'), lat.toFixed(6))
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Location Name"
          fullWidth
          control={control}
          name={getFieldName('name')}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Release Status"
          fullWidth
          control={control}
          name={getFieldName('release_status')}
          options={releaseStatusOptions}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Latitude (decimal degrees)"
          control={control}
          name={getFieldName('latitude')}
          type="number"
          placeholder="34.068279"
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Longitude (decimal degrees)"
          control={control}
          name={getFieldName('longitude')}
          type="number"
          placeholder="-106.904192"
          required
        />
      </Grid>

      <Grid size={{ xs: 12}}>
        <Typography variant="body1" sx={{ paddingBottom: '10px' }}>
          Click on the map to set a location, or enter latitude and longitude above.
        </Typography>
      <MapComponent
            mapRef={mapRef}
            initialViewState={viewState}
            style={{ height: '350px', width: '100%' }}
            showDrawControls={{ show: false }}
            onClick={handleMapClick}
          >
            {watch && watch(getFieldName('latitude')) && watch(getFieldName('longitude')) && (
              <Source
                key="locationMarker"
                id="locationMarker"
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: [
                          Number(watch(getFieldName('longitude'))),
                          Number(watch(getFieldName('latitude')))
                        ]
                      },
                      properties: {}
                    }
                  ]
                }}
              >
                <Layer
                  id="locationMarker"
                  type="circle"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': '#B42222',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 1,
                  }}
                />
              </Source>
            )}
          </MapComponent>
      </Grid>

      <Grid size={12}>
        <ControlledTextField
          label="WKT Point (Auto-generated)"
          control={control}
          name={getFieldName('point')}
          disabled
        />
      </Grid>

      <Grid size={12}>
        <ControlledTextField
          label="Notes"
          control={control}
          name={getFieldName('notes')}
          multiline
          minRows={3}
        />
      </Grid>
    </Grid>
  )
} 