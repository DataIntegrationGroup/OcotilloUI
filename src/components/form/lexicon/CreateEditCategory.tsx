import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import { ControlledTextField, ControlledSelectField } from '@/components'

/**
 * CreateEditSample Component
 * A reusable form component for creating and editing well information.
 *
 * @param control - The control object from useForm
 * @param errors - The errors object from useForm
 * @param mode - The mode of the component ('standalone' or 'step')
 * @param fieldPrefix - The prefix for the field names
 */

interface CreateEditCategoryProps {
  control: Control<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditCategory: React.FC<CreateEditCategoryProps> = ({
  control,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <ControlledTextField
          label="Name"
          fullWidth
          control={control}
          name={getFieldName('name')}
          required
        />
      </Grid>
      <Grid size={12}>
        <ControlledTextField
          label="Description"
          fullWidth
          control={control}
          name={getFieldName('description')}
          required
        />
      </Grid>
    </Grid>
  )
}
