import { Control, FieldErrors, FieldValues } from 'react-hook-form'
import {
  ControlledTextField,
  ControlledSelectField,
  ControlledDateField,
} from '@/components'
import Grid from '@mui/material/Grid2'
import { useLexicon, useSensor } from '@/hooks'

/**
 * CreateEditSample Component
 * A reusable form component for creating and editing well information.
 *
 * @param control - The control object from useForm
 * @param errors - The errors object from useForm
 * @param mode - The mode of the component ('standalone' or 'step')
 * @param fieldPrefix - The prefix for the field names
 */

interface CreateEditSampleProps<T extends FieldValues = FieldValues> {
  control: Control<T>
  errors?: FieldErrors<T>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditSample = <T extends FieldValues>({
  control,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
}: CreateEditSampleProps<T>) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  //lexicon options
  //qc sample
  const { options: qc_options } = useLexicon({
    category: 'qc_sample',
  })

  //sample_type
  const { options: sampleTypeOptions } = useLexicon({
    category: 'sample_type',
  })

  /**
   * @TODO add sample_matrix options to lexicon
   */
  //sample_matrix
  const { options: sampleMatrixOptions } = useLexicon({
    category: 'sample_matrix',
  })

  /**
   * @TODO add sample_method options to lexicon
   */
  //sample_method
  const { options: sampleMethodOptions } = useLexicon({
    category: 'sample_method',
  })

  //release_status
  const { options: releaseStatusOptions } = useLexicon({
    category: 'release_status',
  })

  //sensor options
  const { options: sensorOptions } = useSensor()

  return (
    <Grid container spacing={3} size={12}>
      <Grid size={12}>
        <ControlledSelectField
          control={control}
          name={getFieldName('sample_type')}
          label={'Sample Type'}
          options={sampleTypeOptions}
          required
        />
      </Grid>
      <Grid size={12}>
        <ControlledTextField
          label="Field Sample ID"
          fullWidth
          control={control}
          name={getFieldName('field_sample_id')}
          required
        />
      </Grid>
      <Grid size={12}>
        <ControlledTextField
          label="Duplicate Sample Number"
          fullWidth
          control={control}
          name={getFieldName('duplicate_sample_number')}
          type="number"
        />
      </Grid>
      <Grid size={12}>
        <ControlledDateField
          sx={{ width: '100%' }}
          label="Sample Date"
          name={getFieldName('sample_date')}
          control={control}
          required
        />
      </Grid>
      <Grid size={12}>
        <ControlledTextField
          label="Sampler Name"
          fullWidth
          control={control}
          name={getFieldName('sampler_name')}
          required
        />
      </Grid>
      <Grid size={12}>
        <ControlledSelectField
          control={control}
          name={getFieldName('qc_sample')}
          label={'QC Sample'}
          options={qc_options}
        />
      </Grid>
      <Grid size={12}>
        <ControlledSelectField
          control={control}
          name={getFieldName('sensor_id')}
          label={'Sampling Instrumentation'}
          options={sensorOptions}
        />
      </Grid>
      <Grid size={12}>
        <ControlledSelectField
          label="Sample Matrix"
          control={control}
          name={getFieldName('sample_matrix')}
          options={sampleMatrixOptions}
        />
      </Grid>
      <Grid size={12}>
        <ControlledSelectField
          label="Sample Method"
          control={control}
          name={getFieldName('sample_method')}
          options={sampleMethodOptions}
        />
      </Grid>
      <Grid size={12}>
        <ControlledTextField
          label="Sample Top"
          control={control}
          name={getFieldName('sample_top')}
          type="number"
        />
      </Grid>
      <Grid size={12}>
        <ControlledTextField
          label="Sample Bottom"
          control={control}
          name={getFieldName('sample_bottom')}
          type="number"
        />
      </Grid>
      <Grid size={12}>
        <ControlledSelectField
          label="Release Status"
          control={control}
          name={getFieldName('release_status')}
          options={releaseStatusOptions}
          required
        />
      </Grid>
    </Grid>
  )
}
