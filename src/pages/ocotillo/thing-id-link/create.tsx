import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '@/interfaces'
import { IThingIdLink } from '@/interfaces/ocotillo/IThing'
import { CreateEditThingIdLink } from '@/components/form/thing/CreateEditThingIdLink'

export const ThingIdLinkCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<IThingIdLink, HttpError, Nullable<IThingIdLink>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditThingIdLink
        register={register}
        watch={watch}
        control={control}
        errors={errors}
      />
    </Create>
  )
}
