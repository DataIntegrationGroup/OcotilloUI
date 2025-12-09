import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { CreateEditLocation } from '@/components/form/location/CreateEditLocation'
import { zodResolver } from '@hookform/resolvers/zod'
import { zUpdateLocation } from '@/generated/zod.gen'
import { UpdateLocation } from '@/generated/types.gen'  

export const LocationEdit: React.FC = () => {
  const {
    saveButtonProps,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateLocation, HttpError, Nullable<UpdateLocation>>({
    resolver: zodResolver(zUpdateLocation),
    mode: "onSubmit",
  })

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditLocation 
        control={control}
        errors={errors} 
        mode="standalone" 
        watch={watch} 
        setValue={setValue} />
    </Edit>
  )
}
