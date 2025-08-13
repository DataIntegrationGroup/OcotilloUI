import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { CreateEditLocation } from '@/components/form/location/CreateEditLocation'

export const LocationCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<ILocation, HttpError, Nullable<ILocation>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditLocation control={control} errors={errors} mode="standalone" />
    </Create>
  )
}
