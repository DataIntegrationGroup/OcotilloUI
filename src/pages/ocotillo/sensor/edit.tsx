import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { ISensor } from '@/interfaces/ocotillo/ISensor'
import { CreateEditSensor } from '@/components/form/sensor/CreateEditSensor'

export const SensorEdit: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<ISensor, HttpError, Nullable<ISensor>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditSensor 
        control={control} 
        errors={errors} 
        mode="standalone"
      />
    </Edit>
  )
}
