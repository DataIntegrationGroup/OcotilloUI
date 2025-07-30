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

interface LocationFormProps {
  control: Control<any>
  watch?: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const LocationForm: React.FC<LocationFormProps> = ({
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
          options={[
            { value: 'draft', label: 'Draft' }
          ]}
          required
        />
      </Grid>

      <Grid size={12}>
        <ControlledTextField
          label="Location Coordinates POINT (X Y)"
          control={control}
          name={getFieldName('point')}
          placeholder='POINT(-106.5 35.1)'
          helperText="Enter coordinates in POINT (X Y) format"
          required
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