import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { ISensor } from '@/interfaces/ocotillo/ISensor'
import { CreateEditSensor } from '@/components/form/sensor/CreateEditSensor'

export const SensorCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<ISensor, HttpError, Nullable<ISensor>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditSensor 
        control={control} 
        errors={errors} 
        mode="standalone"
      />
    </Create>
  )
}
