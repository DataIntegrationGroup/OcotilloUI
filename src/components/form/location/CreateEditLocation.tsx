import { useEffect, useRef, useState } from 'react'
import {
  Control,
  FieldValues,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
  useWatch,
  type Path,
  type PathValue,
} from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import {
  ControlledTextField,
  ControlledNumberField,
  ControlledSelectField,
  MapComponent,
} from '@/components'
import { useLexicon } from '@/hooks'
import { MapRef, ViewState, Source, Layer } from 'react-map-gl'
import {
  Typography,
  FormControlLabel,
  Switch,
  Box,
  TextField,
  Select,
  MenuItem,
} from '@mui/material'
import wellknown from 'wellknown'
import { convertUTMToLonLat, convertLonLatToUTM, Datum } from '@/utils'
import { useElevation } from '@/hooks'

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

interface CreateEditLocationProps<T extends FieldValues = FieldValues> {
  control: Control<T>
  watch?: UseFormWatch<T>
  setValue?: UseFormSetValue<T>
  errors?: FieldErrors<T>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditLocation = <T extends FieldValues>({
  control,
  setValue,
  mode = 'standalone',
  fieldPrefix = '',
}: CreateEditLocationProps<T>) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  const fieldPath = (fieldName: string) =>
    getFieldName(fieldName) as Path<T>

  const containerRef = useRef<HTMLDivElement | null>(null)

  //boolean to toggle mode between UTM and Lat/Long
  const [useUTM, setUseUTM] = useState(false)

  //Local state for UTM zone/datum/easting/northing/lat/long since only point is sent to backend
  const [utmZone, setUtmZone] = useState(13)
  const [utmDatum, setUtmDatum] = useState<Datum>('NAD83')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [easting, setEasting] = useState('')
  const [northing, setNorthing] = useState('')

  const [autoGenerateElevation, setAutoGenerateElevation] = useState(true)

  // Only watch the actual form fields
  const point = useWatch({ control, name: fieldPath('point') })

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
  const { options: releaseStatusOptions, isLoading: releaseStatusLoading } =
    useLexicon({
      category: 'release_status',
    })

  //get elevation method options
  const { options: elevationMethodOptions, isLoading: elevationMethodLoading } =
    useLexicon({
      category: 'elevation_method',
    })

  //get coordinate method options
  const {
    options: coordinateMethodOptions,
    isLoading: coordinateMethodLoading,
  } = useLexicon({
    category: 'coordinate_method',
  })

  //get lat long from WKT point when edit location is loaded
  useEffect(() => {
    if (setValue && point) {
      try {
        const geometry = wellknown.parse(point as string)
        if (
          geometry &&
          geometry.type === 'Point' &&
          'coordinates' in geometry
        ) {
          const [lng, lat] = geometry.coordinates as [number, number]
          setLongitude(lng.toString())
          setLatitude(lat.toString())
          setViewState((prev) => ({ ...prev, longitude: lng, latitude: lat }))
        }
      } catch (e) {
        console.error('Error parsing WKT point:', e)
      }
    }
  }, [setValue, point])

  //update map on change of coords
  useEffect(() => {
    if (latitude && longitude) {
      if (!isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
        setViewState((prev) => ({
          ...prev,
          longitude: Number(longitude),
          latitude: Number(latitude),
        }))
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [Number(longitude), Number(latitude)],
          })
        }
      }
    }
  }, [latitude, longitude])

  //handle map click to set lat and long or easting and northing
  const handleMapClick = (e: any) => {
    const { lng: lon, lat } = e.lngLat
    if (useUTM) {
      const { easting, northing } = convertLonLatToUTM(
        { lon, lat },
        utmZone,
        utmDatum
      )
      setEasting(easting.toFixed(3))
      setNorthing(northing.toFixed(3))
    } else {
      setLongitude(lon.toFixed(10))
      setLatitude(lat.toFixed(10))
    }
  }

  // Handle automatic coordinate conversions
  useEffect(() => {
    if (useUTM && easting && northing) {
      // UTM to Lat/Long
      const [lng, lat] = convertUTMToLonLat(
        Number(easting),
        Number(northing),
        utmZone,
        utmDatum
      )
      setLongitude(lng.toFixed(10))
      setLatitude(lat.toFixed(10))
    } else if (!useUTM && latitude && longitude) {
      // Lat/Long to UTM
      const { easting, northing } = convertLonLatToUTM(
        { lon: Number(longitude), lat: Number(latitude) },
        utmZone,
        utmDatum
      )
      setEasting(easting.toFixed(3))
      setNorthing(northing.toFixed(3))
    }
  }, [useUTM, easting, northing, latitude, longitude, utmZone, utmDatum])

  // handle coordinate system toggle
  const handleCoordinateSystemToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUseUTM(event.target.checked)
  }

  // use elevation hook to fetch form USGS DEM
  const elevationQuery = useElevation(
    Number(longitude),
    Number(latitude),
    autoGenerateElevation
  )

  // Set form values when elevation data is fetched
  useEffect(() => {
    if (
      autoGenerateElevation &&
      elevationQuery.isSuccess &&
      elevationQuery.data
    ) {
      const elevationInFeet = elevationQuery.data.value.toFixed(2)

      if (setValue) {
        setValue(
          fieldPath('elevation'),
          Number(elevationInFeet) as PathValue<T, Path<T>>
        )
        setValue(
          fieldPath('elevation_accuracy'),
          Number(1.74) as PathValue<T, Path<T>>
        )
      }
    }
  }, [
    autoGenerateElevation,
    elevationQuery.isSuccess,
    elevationQuery.data,
    setValue,
  ])

  // clear elevation fields when turning off auto-generation
  const handleElevationToggle = (checked: boolean) => {
    setAutoGenerateElevation(checked)
    if (!checked && setValue) {
      setValue(
        fieldPath('elevation'),
        undefined as PathValue<T, Path<T>>
      )
      setValue(
        fieldPath('elevation_accuracy'),
        undefined as PathValue<T, Path<T>>
      )
    }
  }

  //auto-generate WKT point from latitude and longitude
  useEffect(() => {
    if (setValue && latitude && longitude) {
      setValue(
        fieldPath('point'),
        `POINT(${longitude} ${latitude})` as PathValue<T, Path<T>>
      )
    }
  }, [setValue, latitude, longitude])

  return (
    <Grid container spacing={3}>
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
          You are using:{' '}
          {useUTM ? 'Northing/Easting (UTM)' : 'Decimal Degrees (Lat/Long)'}
        </Typography>
        <Typography variant="body2" color="text.primary">
          Unit conversions are automatic
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="UTM Zone"
          value={utmZone}
          onChange={(e) => setUtmZone(Number(e.target.value))}
          type="number"
          placeholder="13"
          disabled={!useUTM}
          fullWidth
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Select
          value={utmDatum}
          onChange={(e) => setUtmDatum(e.target.value as Datum)}
          disabled={!useUTM}
          fullWidth
        >
          <MenuItem value="NAD83">NAD83</MenuItem>
        </Select>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Easting (UTM X)"
          value={easting}
          onChange={(e) => setEasting(e.target.value)}
          type="number"
          placeholder="500000"
          disabled={!useUTM}
          fullWidth
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Northing (UTM Y)"
          value={northing}
          onChange={(e) => setNorthing(e.target.value)}
          type="number"
          placeholder="4000000"
          disabled={!useUTM}
          fullWidth
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Latitude (decimal degrees)"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          type="number"
          placeholder="34.068279"
          disabled={useUTM}
          fullWidth
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Longitude (decimal degrees)"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          type="number"
          placeholder="-106.904192"
          disabled={useUTM}
          fullWidth
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledNumberField
          label="Coordinate Accuracy (ft)"
          control={control}
          name={getFieldName('coordinate_accuracy')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Coordinate Method"
          id="coordinate-method"
          labelId="coordinate-method-label"
          control={control}
          name={getFieldName('coordinate_method')}
          options={coordinateMethodOptions}
          disabled={coordinateMethodLoading}
        />
      </Grid>
      <Grid size={12} ref={containerRef} component="div">
        <Typography variant="body1" sx={{ paddingBottom: '10px' }}>
          Click on the map to set a location, or enter coordinates above.
        </Typography>
        <MapComponent
          containerRef={containerRef}
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
                      coordinates: [Number(longitude), Number(latitude)],
                    },
                    properties: {},
                  },
                ],
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
        <ControlledNumberField
          label="Elevation (ft)"
          control={control}
          name={getFieldName('elevation')}
          placeholder="5000"
          disabled={autoGenerateElevation}
          required={!autoGenerateElevation}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledNumberField
          label="Elevation Accuracy (ft)"
          control={control}
          name={getFieldName('elevation_accuracy')}
          placeholder="1.74"
          disabled={autoGenerateElevation}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Elevation Method"
          id="elevation-method"
          labelId="elevation-method-label"
          control={control}
          name={getFieldName('elevation_method')}
          options={elevationMethodOptions}
          disabled={elevationMethodLoading}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Release Status"
          id="release-status"
          labelId="release-status-label"
          control={control}
          name={getFieldName('release_status')}
          options={releaseStatusOptions}
          disabled={releaseStatusLoading}
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
