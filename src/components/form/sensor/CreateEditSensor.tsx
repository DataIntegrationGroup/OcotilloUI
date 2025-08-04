import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import { ControlledTextField, ControlledSelectField } from '@/components'
import { useLexicon } from '@/hooks'

/**
 * CreateEditSample Component
 * A reusable form component for creating and editing well information.
 *
 * @param control - The control object from useForm
 * @param errors - The errors object from useForm
 * @param mode - The mode of the component ('standalone' or 'step')
 * @param fieldPrefix - The prefix for the field names
 */

interface CreateEditSampleProps {
  control: Control<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditSensor: React.FC<CreateEditSampleProps> = ({
  control,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  //get well type options
  const { options: wellTypeOptions, isLoading: wellTypeLoading } = useLexicon({
    category: 'well_type',
  })

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Sensor Name"
          fullWidth
          control={control}
          name={getFieldName('name')}
          required
        />
      </Grid>

      {/*<Grid size={{ xs: 12, md: 6 }}>*/}
      {/*  <ControlledSelectField*/}
      {/*    label="Sample Type"*/}
      {/*    fullWidth*/}
      {/*    control={control}*/}
      {/*    name={getFieldName('well_type')}*/}
      {/*    options={wellTypeOptions}*/}
      {/*    required*/}
      {/*  />*/}
      {/*</Grid>*/}

      {/*<Grid size={{ xs: 12, md: 6 }}>*/}
      {/*  <ControlledTextField*/}
      {/*    label="Sample Depth (ft)"*/}
      {/*    fullWidth*/}
      {/*    type="number"*/}
      {/*    control={control}*/}
      {/*    name={getFieldName('well_depth')}*/}
      {/*  />*/}
      {/*</Grid>*/}

      {/*<Grid size={{ xs: 12, md: 6 }}>*/}
      {/*  <ControlledTextField*/}
      {/*    label="Hole Depth (ft)"*/}
      {/*    fullWidth*/}
      {/*    type="number"*/}
      {/*    control={control}*/}
      {/*    name={getFieldName('hole_depth')}*/}
      {/*  />*/}
      {/*</Grid>*/}

      {/*<Grid size={12}>*/}
      {/*  <ControlledTextField*/}
      {/*    label="Notes"*/}
      {/*    control={control}*/}
      {/*    name={getFieldName('notes')}*/}
      {/*    multiline*/}
      {/*    minRows={3}*/}
      {/*  />*/}
      {/*</Grid>*/}
    </Grid>
  )
}
