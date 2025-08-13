import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { ILocation } from '@/interfaces/ocotillo/ILocation'
import { CreateEditLocation } from '@/components/form/location/CreateEditLocation'

export const LocationEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    formState: { errors },
  } = useForm<ILocation, HttpError, Nullable<ILocation>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditLocation control={control} errors={errors} mode="standalone" />
    </Edit>
  )
}
