import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import { ControlledTextField, ControlledSelectField } from '@/components'
import { useList } from '@refinedev/core'

/**
 * CreateEditSample Component
 * A reusable form component for creating and editing well information.
 *
 * @param control - The control object from useForm
 * @param errors - The errors object from useForm
 * @param mode - The mode of the component ('standalone' or 'step')
 * @param fieldPrefix - The prefix for the field names
 */

interface CreateEditTermProps {
  control: Control<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditTerm: React.FC<CreateEditTermProps> = ({
  control,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  const { data: categories, isLoading: categoriesLoading } = useList({
    resource: 'lexicon/category',
    pagination: {
      pageSize: 10000,
    },
  })

  console.log('categories', categories)

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <ControlledTextField
          label="Term"
          fullWidth
          control={control}
          name={getFieldName('term')}
          required
        />
      </Grid>
      <Grid size={12}>
        <ControlledTextField
          label="Definition"
          fullWidth
          control={control}
          name={getFieldName('definition')}
          required
        />
      </Grid>

      <Grid size={12}>
        <ControlledSelectField
          label="Category"
          fullWidth
          control={control}
          name={getFieldName('category')}
          options={
            categories?.data.map((category) => ({
              label: category.name,
              value: category.id,
            })) || []
          }
          required
        />
      </Grid>
    </Grid>
  )
}
