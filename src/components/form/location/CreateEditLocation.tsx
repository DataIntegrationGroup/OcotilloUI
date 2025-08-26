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
} from '@/components'
import { useLexicon } from '@/hooks'
import { useEffect } from 'react'

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
          label="Latitude"
          control={control}
          name={getFieldName('latitude')}
          type="number"
          placeholder="34.068279"
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Longitude"
          control={control}
          name={getFieldName('longitude')}
          type="number"
          placeholder="-106.904192"
          required
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