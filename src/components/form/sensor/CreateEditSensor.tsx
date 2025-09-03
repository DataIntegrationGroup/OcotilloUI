import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import { ControlledTextField, ControlledSelectField, ControlledDateField } from '@/components'
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

interface CreateEditSensorProps {
  control: Control<any>
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
}

export const CreateEditSensor: React.FC<CreateEditSensorProps> = ({
  control,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }
  
  //get relesae status options
  const { options: releaseStatusOptions } = useLexicon({
    category: 'release_status',
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

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Model"
          fullWidth
          control={control}
          name={getFieldName('model')}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Serial No"
          fullWidth
          control={control}
          name={getFieldName('serial_no')}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledDateField
          label="Date Installed"
          fullWidth
          control={control}
          name={getFieldName('datetime_installed')}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledDateField
          label="Date Removed"
          fullWidth
          control={control}
          name={getFieldName('datetime_removed')}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Recording Interval"
          type="number"
          fullWidth
          control={control}
          name={getFieldName('recording_interval')}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Notes"
          fullWidth
          control={control}
          name={getFieldName('notes')}
          multiline
          minRows={3}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledSelectField
          label="Release Status"
          control={control}
          name={getFieldName('release_status')}
          options={releaseStatusOptions}
        />
      </Grid>

    </Grid>
  )
}
