import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { IWellScreen } from '@/interfaces/ocotillo/IWellScreen'
import { CreateEditWellScreen } from '@/components/form/thing/CreateEditWellScreen'

export const WellScreenCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<IWellScreen, HttpError, Nullable<IWellScreen>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditWellScreen
        errors={errors}
        control={control}
        register={register}
        setValue={setValue}
        mode={'standalone'}
      />
    </Create>
  )
}
;``
