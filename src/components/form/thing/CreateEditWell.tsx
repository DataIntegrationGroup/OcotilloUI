import { Control, FieldErrors, FieldValues } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import {
  ControlledTextField,
  ControlledSelectField,
} from '@/components'
import { useLexicon } from '@/hooks'

/**
 * CreateEditWell Component
 * A reusable form component for creating and editing well information.
 * 
 * @param control - The control object from useForm
 * @param errors - The errors object from useForm
 * @param mode - The mode of the component ('standalone' or 'step')
 * @param fieldPrefix - The prefix for the field names
 */

interface CreateEditWellProps<T extends FieldValues = FieldValues> {
  control: Control<T>
  errors?: FieldErrors<T>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditWell = <T extends FieldValues>({
  control,
  errors,
  mode = 'standalone',
  fieldPrefix = ''
}: CreateEditWellProps<T>) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  //get well type options
  const { options: wellTypeOptions, isLoading: wellTypeLoading } = useLexicon({ 
    category: 'well_type' 
  })

  //get release status options
  const { options: releaseStatusOptions, isLoading: releaseStatusLoading } = useLexicon({ 
    category: 'release_status' 
  })

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
          label="Release Status"
          fullWidth
          control={control}
          name={getFieldName('release_status')}
          options={releaseStatusOptions}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Well Type"
          fullWidth
          control={control}
          name={getFieldName('well_type')}
          options={wellTypeOptions}
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
