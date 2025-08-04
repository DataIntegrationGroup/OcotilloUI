import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import {
  ControlledTextField,
  ControlledSelectField,
  ControlledDateField,
} from '@/components'
import { useLexicon } from '@/hooks'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
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

interface CreateEditSampleProps {
  control: Control<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditSample: React.FC<CreateEditSampleProps> = ({
  control,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  // const { options: qc_options, isLoading: qcLoading } = useLexicon({
  //   category: 'qc_sample',
  // })
  const qc_options = [
    { label: 'original', value: 'original' },
    { label: 'duplicate', value: 'duplicate' },
  ]

  const { data } = useList({
    resource: 'sensor',
    dataProviderName: 'dataforge',
  })

  //todo: probably need to make this an autocomplete field?
  const sensor_options =
    data?.data.map((sensor: any) => ({
      label: sensor.name,
      value: sensor.id,
    })) || []

  return (
    <Grid container spacing={3} size={12}>
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
          type="number"
          control={control}
          name={getFieldName('duplicate_sample_number')}
        />
      </Grid>
      <Grid size={12}>
        <ControlledDateField
          sx={{ width: '100%' }}
          label="Sample Date"
          name={getFieldName('sample_date')}
          control={control}
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
          label={'Sensor'}
          options={sensor_options}
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
