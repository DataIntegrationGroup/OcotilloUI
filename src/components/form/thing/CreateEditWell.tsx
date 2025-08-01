import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import {
  ControlledTextField,
  ControlledSelectField,
} from '@/components'

/**
 * CreateEditWell Component
 * A reusable form component for creating and editing well information.
 * 
 * @param control - The control object from useForm
 * @param errors - The errors object from useForm
 * @param mode - The mode of the component ('standalone' or 'step')
 * @param fieldPrefix - The prefix for the field names
 */

interface CreateEditWellProps {
  control: Control<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditWell: React.FC<CreateEditWellProps> = ({
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
