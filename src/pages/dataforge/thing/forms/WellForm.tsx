import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import {
  ControlledTextField,
  ControlledSelectField,
} from '@/components'

interface WellFormProps {
  control: Control<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const WellForm: React.FC<WellFormProps> = ({
  control,
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
          label="Well Name"
          fullWidth
          control={control}
          name={getFieldName('name')}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Well Type"
          fullWidth
          control={control}
          name={getFieldName('well_type')}
          options={[
            { value: 'draft', label: 'Draft' }
          ]}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Well Depth (ft)"
          fullWidth
          type="number"
          control={control}
          name={getFieldName('well_depth')}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Hole Depth (ft)"
          fullWidth
          type="number"
          control={control}
          name={getFieldName('hole_depth')}
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
