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
import { useLexicon } from '@/hooks'
import { ControlledSelectField } from '@/components/Controlled/ControlledSelectField'

export const CreateEditGroup = ({
  control,
  register,
  errors,
  setValue,
  mode,
  fieldPrefix = '',
}) => {

  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  //release status options
  const { options: releaseStatusOptions, isLoading: releaseStatusLoading } = useLexicon({ 
    category: 'release_status' 
  })

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
  const mapRef = useRef(null)

  useEffect(() => {
    if (!polygon) {
      return
    }

    const keys = Object.keys(polygon)
    const p = polygon[keys[0]]
    // convert the geojson polygon to WKT
    const wkt = wellknown.stringify(p.geometry)
    setValue('project_area', wkt)
  }, [polygon])

  const handleMapExtentSearch = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      const bounds = map.getBounds()
      const wktString = wellknown.stringify({
        type: 'MultiPolygon',
        coordinates: [
          [[
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
            [bounds.getWest(), bounds.getNorth()],
            [bounds.getWest(), bounds.getSouth()],
          ]],
        ],
      })
      setValue('project_area', wktString)
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
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="parent_group_id"
          control={control}
          // rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompleteProps}
              onChange={(_, newValue: any) => {
                field.onChange(newValue?.id || null)
              }}
              getOptionKey={(option: any) => option.id}
              getOptionLabel={(option: any) => option.name || ''}
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
      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Release Status"
          fullWidth
          control={control}
          name={getFieldName('release_status')}
          options={releaseStatusOptions}
        />
      </Grid>
      <Grid size={{ xs: 12}}>
        <TextField
          {...register('description')}
          error={!!errors.description}
          helperText={errors.description?.message}
          margin="normal"
          fullWidth
          label="Description"
          name="description"
        />
      </Grid>
      <Grid size={12}>
        <Typography>Project Area</Typography>
        <Button variant={'contained'} onClick={handleMapExtentSearch}>
          Use Map Extent
        </Button>
      </Grid>
      <Grid size={12}>
        <TextField
          {...register('project_area')}
          fullWidth
          error={!!errors.project_area}
          helperText={errors.project_area?.message}
          name="project_area"
        />
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
