import { 
    Control, 
    UseFormWatch, 
    UseFormSetValue, 
    FieldErrors,
    useWatch,
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
import { Typography, FormControlLabel, Switch, Box, InputAdornment, IconButton, Tooltip } from '@mui/material'
import wellknown from 'wellknown'
import { convertUTMToLonLat, convertLonLatToUTM } from '@/utils/UtmToLonLat'
import { useElevation } from '@/hooks/useElevation'

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
  
  const [useUTM, setUseUTM] = useState(false)
  const [autoGenerateElevation, setAutoGenerateElevation] = useState(true)
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

  // use useWatch to get form values reactively
  const latitude = useWatch({ control, name: getFieldName('latitude') })
  const longitude = useWatch({ control, name: getFieldName('longitude') })
  const point = useWatch({ control, name: getFieldName('point') })
  const easting = useWatch({ control, name: getFieldName('easting') })
  const northing = useWatch({ control, name: getFieldName('northing') })
  const utmZone = useWatch({ control, name: getFieldName('utm_zone') })
  const utmDatum = useWatch({ control, name: getFieldName('utm_datum') })
  const elevation = useWatch({ control, name: getFieldName('elevation') })


  //get lat long from WKT point when edit location is loaded
  useEffect(() => {
    if (setValue && point) {
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
  }, [setValue, point])

  //update map on change of coords
  useEffect(() => {
    if (latitude && longitude) {
      if (!isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
        setViewState(prev => ({
          ...prev,
          longitude: Number(longitude),
          latitude: Number(latitude)
        }))
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [Number(longitude), Number(latitude)]
          })
        }
      }
    }
  }, [latitude, longitude])

  //handle map click to set lat and long or easting and northing
  const handleMapClick = (e: any) => {
    if (setValue) {
      const { lng, lat } = e.lngLat
      if (useUTM) {
        const [easting, northing] = convertLonLatToUTM(lng, lat, Number(utmZone) || 13, utmDatum || 'WGS84')
        setValue(getFieldName('easting'), easting.toFixed(3))
        setValue(getFieldName('northing'), northing.toFixed(3))
      } else {
        setValue(getFieldName('longitude'), lng.toFixed(10))
        setValue(getFieldName('latitude'), lat.toFixed(10))
      }
    }
  }

  // Handle automatic coordinate conversions using helper util functions
  useEffect(() => {
    if (!setValue || !utmZone || !utmDatum) return;

    if (useUTM && easting && northing) {
      // UTM to Lat/Long
      const [lng, lat] = convertUTMToLonLat(Number(easting), Number(northing), Number(utmZone), utmDatum);
      setValue(getFieldName('longitude'), lng.toFixed(10));
      setValue(getFieldName('latitude'), lat.toFixed(10));
    } else if (!useUTM && latitude && longitude) {
      // Lat/Long to UTM
      const [easting, northing] = convertLonLatToUTM(Number(longitude), Number(latitude), utmZone, utmDatum);
      setValue(getFieldName('easting'), easting.toFixed(3));
      setValue(getFieldName('northing'), northing.toFixed(3));
    }
  }, [useUTM, setValue, easting, northing, latitude, longitude, utmZone, utmDatum]);

  // Set default UTM values when component mounts if they don't exist
  useEffect(() => {
    if (setValue) {
      if (!utmZone) {
        setValue(getFieldName('utm_zone'), 13)
      }
      if (!utmDatum) {
        setValue(getFieldName('utm_datum'), 'WGS84')
      }
    }
  }, [setValue, utmZone, utmDatum])

  // handle coordinate system toggle
  const handleCoordinateSystemToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseUTM(event.target.checked)
  }

  // use elevation hook to fetch form USGS DEM
  const elevationQuery = useElevation(longitude, latitude, autoGenerateElevation)

  // Set form values when elevation data is fetched
  useEffect(() => {
    if (autoGenerateElevation && elevationQuery.isSuccess && elevationQuery.data) {
      const elevationInFeet = elevationQuery.data.value.toFixed(2)
      
      if (setValue) {
        setValue(getFieldName('elevation'), elevationInFeet)
        setValue(getFieldName('elevation_accuracy'), 1.74)
        setValue(getFieldName('elevation_datum'), 'NAVD88')
        setValue(getFieldName('elevation_method'), 'USGS DEM')
      }
    }
  }, [autoGenerateElevation, elevationQuery.isSuccess, elevationQuery.data, setValue])

  // clear elevation fields when turning off auto-generation
  const handleElevationToggle = (checked: boolean) => {
    setAutoGenerateElevation(checked)
    if (!checked && setValue) {
      setValue(getFieldName('elevation'), undefined)
      setValue(getFieldName('elevation_accuracy'), undefined)
      setValue(getFieldName('elevation_datum'), '')
      setValue(getFieldName('elevation_method'), '')
    }
  }

  //auto-generate WKT point from latitude and longitude and elevation
  //TODO: add back elevation when availabe via API
  useEffect(() => {
    if (setValue && latitude && longitude && elevation) {
      setValue(getFieldName('point'), `POINT(${longitude} ${latitude})`) 
    }
  }, [setValue, latitude, longitude, elevation])

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

      <Grid size={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useUTM}
                onChange={handleCoordinateSystemToggle}
                color="primary"
              />
            }
            label="Toggle between using Northing/Easting or Latitude/Longitude"
          />
        </Box>
        <Typography variant="body1" color="text.primary">
           You are using: {useUTM ? 'Northing/Easting (UTM)' : 'Decimal Degrees (Lat/Long)'}
          </Typography>
          <Typography variant="body2" color="text.primary">
            Unit conversions are automatic
          </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="UTM Zone"
          control={control}
          name={getFieldName('utm_zone')}
          type="number"
          placeholder="13"
          disabled={!useUTM}
          required={useUTM}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="UTM Datum"
          control={control}
          name={getFieldName('utm_datum')}
          options={[
            { value: 'WGS84', label: 'WGS84' },
            { value: 'NAD83', label: 'NAD83' }
          ]}
          disabled={!useUTM}
          required={useUTM}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Easting (UTM X)"
          control={control}
          name={getFieldName('easting')}
          type="number"
          placeholder="500000"
          disabled={!useUTM}
          required={useUTM}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Northing (UTM Y)"
          control={control}
          name={getFieldName('northing')}
          type="number"
          placeholder="4000000"
          disabled={!useUTM}
          required={useUTM}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Latitude (decimal degrees)"
          control={control}
          name={getFieldName('latitude')}
          type="number"
          placeholder="34.068279"
          disabled={useUTM}
          required={!useUTM}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Longitude (decimal degrees)"
          control={control}
          name={getFieldName('longitude')}
          type="number"
          placeholder="-106.904192"
          disabled={useUTM}
          required={!useUTM}
        />
      </Grid>

      <Grid size={12}>
        <Typography variant="body1" sx={{ paddingBottom: '10px' }}>
          Click on the map to set a location, or enter coordinates above.
        </Typography>
        <MapComponent
          mapRef={mapRef}
          initialViewState={viewState}
          style={{ height: '350px', width: '100%' }}
          showDrawControls={{ show: false }}
          onClick={handleMapClick}
        >
          {latitude && longitude && (
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
                        Number(longitude),
                        Number(latitude)
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
        <FormControlLabel
          control={
            <Switch
              checked={autoGenerateElevation}
              onChange={(e) => handleElevationToggle(e.target.checked)}
            />
          }
          label="Auto-generate elevation from USGS DEM"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Elevation (ft)"
          control={control}
          name={getFieldName('elevation')}
          type="number"
          placeholder="5000"
          disabled={autoGenerateElevation}
          required={!autoGenerateElevation}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Elevation Accuracy (ft)"
          control={control}
          name={getFieldName('elevation_accuracy')}
          type="number"
          placeholder="1.74"
          disabled={autoGenerateElevation}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Elevation Datum"
          control={control}
          name={getFieldName('elevation_datum')}
          placeholder="NAVD88"
          disabled={autoGenerateElevation}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Elevation Method"
          control={control}
          name={getFieldName('elevation_method')}
          placeholder="USGS DEM"
          disabled={autoGenerateElevation}
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

      <Grid size={12}>
        <ControlledTextField
          label="WKT Point (Auto-generated)"
          control={control}
          name={getFieldName('point')}
          disabled
        />
      </Grid>

    </Grid>
  )
} 