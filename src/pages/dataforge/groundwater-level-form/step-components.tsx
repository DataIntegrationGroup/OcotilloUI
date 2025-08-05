import { FormReview } from '@/components/form/stepper/FormReview'
import Grid from '@mui/material/Grid2'
import { Typography } from '@mui/material'
import { CreateEditSample } from '@/components/form/sample/CreateEditSample'
import { GroundwaterLevelEntryComponent } from '@/components/form/observation/GroundwaterLevelEntryComponent'
import { SelectThingComponent } from '@/components/form/thing/SelectThingComponent'

export const WellStep: React.FC<{
  control: any
  errors: any
  watch: any
}> = ({ control, errors, watch }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Typography variant="h6" gutterBottom>
        Well Information
      </Typography>
    </Grid>

    <Grid size={12}>
      <SelectThingComponent
        label="Select Water Well"
        thing_type={'water well'}
        control={control}
        errors={errors}
        watch={watch}
      />
    </Grid>
  </Grid>
)

export const ObservationStep: React.FC<{
  register: any
  control: any
  watch: any
  errors: any
}> = ({ register, control, watch, errors }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Typography variant="h6" gutterBottom>
        Observation Information
      </Typography>
    </Grid>
    <GroundwaterLevelEntryComponent
      register={register}
      control={control}
      errors={errors}
      watch={watch}
      mode="step"
    />
  </Grid>
)

export const SampleStep: React.FC<{
  control: any
  watch: any
  errors: any
}> = ({ control, watch, errors }) => (
  <Grid container spacing={3}>
    <Grid size={12}>
      <Typography variant="h6" gutterBottom>
        Sample Information
      </Typography>
    </Grid>

    {/*  /components/form/sample/CreateEditSample.tsx */}
    <CreateEditSample
      control={control}
      errors={errors}
      mode="step"
      fieldPrefix="sample."
    />
  </Grid>
)

export const ReviewStep = ({ watch }: any) => {
  const formData = watch()
  console.log(formData)
  const sections = [
    {
      title: 'Well Information',
      items: [{ label: 'Thing ID', value: formData.thing_id }],
    },
    {
      title: 'Sample Information',
      items: [
        { label: 'Field Sample ID', value: formData.sample.field_sample_id },
        {
          label: 'Sample Date',
          value: formData.sample.sample_date.toISOString(),
        },
        { label: 'QC Sample', value: formData.sample.qc_sample },
        { label: 'Sample Type', value: formData.sample.sample_type },
        {
          label: 'Duplicate Sample Number',
          value: formData.sample.duplicate_sample_number,
        },
        { label: 'Sensor ID', value: formData.sample.sensor_id },
        { label: 'Notes', value: formData.sample.notes },
        { label: 'Release Status', value: formData.sample.release_status },
      ],
    },
    {
      title: 'Observation Information',
      items: [
        {
          label: 'Observed Property',
          value: formData.observation.observed_property,
        },
        {
          label: 'Observation Timestamp',
          value: formData.observation.observation_timestamp.toISOString(),
        },
        { label: 'Depth to Water', value: formData.observation.depth_to_water },
        {
          label: 'Measuring Point Height',
          value: formData.observation.measuring_point_height,
        },
        { label: 'Sensor ID', value: formData.observation.sensor_id },
        { label: 'Release Status', value: formData.observation.release_status },
        { label: 'Level Status', value: formData.observation.level_status },
      ],
    },
  ]

  return (
    <FormReview title="Review Groundwater Level Data" sections={sections} />
  )
}
