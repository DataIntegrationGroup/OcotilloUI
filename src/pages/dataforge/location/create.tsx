import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { ILocation } from '@/interfaces/dataforge/ILocation'
import { LocationForm } from './forms'

export const LocationCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<ILocation, HttpError, Nullable<ILocation>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <LocationForm
        control={control}
        errors={errors}
        mode="standalone"
      />
    </Create>
  )
}
