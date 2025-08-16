import { useAutocomplete } from '@refinedev/mui'
// import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import { Controller } from 'react-hook-form'
import { Autocomplete, Typography } from '@mui/material'
import { useRef, useEffect, useState } from 'react'
import { MapPolygonComponent } from '@/components/MapPolygonComponent'
import Grid from '@mui/material/Grid2'
import wellknown from 'wellknown'

export const CreateEditGroup = ({ control, register, errors, mode }) => {
  const { autocompleteProps } = useAutocomplete<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  const [polygon, setPolygon] = useState(null)
  const [projectAreaWKT, setProjectAreaWKT] = useState('')
  const mapRef = useRef(null)

  useEffect(() => {
    if (!polygon) {
      return
    }

    const keys = Object.keys(polygon)
    const p = polygon[keys[0]]
    // convert the geojson polygon to WKT
    const wkt = wellknown.stringify(p.geometry)
    setProjectAreaWKT(wkt)
  }, [polygon])

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
      setProjectAreaWKT(wktString)
    }
  }

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={12}>
        <TextField
          {...register('name', {
            required: 'This field is required',
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          autoFocus
        />
      </Grid>
      <Grid size={12}>
        <Controller
          name="parent_group_id"
          control={control}
          // rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompleteProps}
              onChange={(_, newValue) => {
                field.onChange(newValue?.id || null)
              }}
              getOptionKey={(option) => option.id}
              getOptionLabel={(option) => option.name || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parent Group"
                  margin="normal"
                  error={!!errors.parent_group_id}
                  helperText={errors.parent_group_id?.message}
                />
              )}
            />
          )}
        />
      </Grid>
      <Grid size={12}>
        <Typography>Project Area</Typography>
        <Button variant={'contained'} onClick={handleMapExtentSearch}>
          Use Map Extent
        </Button>
      </Grid>
      <Grid size={12}>
        <TextField fullWidth value={projectAreaWKT} />
      </Grid>
      <Grid size={12}>
        <MapPolygonComponent
          mapRef={mapRef}
          polygon={polygon}
          setPolygon={setPolygon}
        />
      </Grid>
    </Grid>
  )
}
