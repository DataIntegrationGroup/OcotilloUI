import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { CreateLocation } from '@/generated/types.gen'
import { zodResolver } from '@hookform/resolvers/zod'
import { zCreateLocation } from '@/generated/zod.gen'
import { CreateEditLocation } from '@/components/form/location/CreateEditLocation'

export const LocationCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLocation, HttpError, Nullable<CreateLocation>>({
    resolver: zodResolver(zCreateLocation),
    mode: "onSubmit",
  })

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditLocation 
        control={control}
        errors={errors}
        mode="standalone"
        watch={watch}
        setValue={setValue} />
    </Create>
  )
}
