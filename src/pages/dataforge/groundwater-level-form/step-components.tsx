import { FormReview } from '@/components/form/stepper/FormReview'
import { CreateEditSample } from '@/components/form/sample/CreateEditSample'
import { GroundwaterLevelEntryComponent } from '@/components/form/observation/GroundwaterLevelEntryComponent'
import { SelectWellComponent } from '@/components/form/thing/SelectWellComponent'

export const WellStep: React.FC<{
  control: any
  errors: any
  watch: any
}> = ({ control, errors, watch }) => (
  <SelectWellComponent
    label="Select Water Well"
    thing_type={'water well'}
    control={control}
    errors={errors}
    watch={watch}
  />
)

export const ObservationStep: React.FC<{
  register: any
  control: any
  watch: any
  errors: any
}> = ({ register, control, watch, errors }) => (
  <GroundwaterLevelEntryComponent
    register={register}
    control={control}
    errors={errors}
    watch={watch}
    mode="step"
  />
)

export const SampleStep: React.FC<{
  control: any
  watch: any
  errors: any
}> = ({ control, watch, errors }) => (
  <CreateEditSample
    control={control}
    errors={errors}
    mode="step"
    fieldPrefix="sample."
  />
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
          value: formData.observation.obserfation_datetime.toISOString(),
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
