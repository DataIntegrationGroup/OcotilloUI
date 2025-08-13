import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import { Nullable } from '../../../interfaces'
import { IAsset } from '@/interfaces/ocotillo/IAsset'
import { CreateEditAsset } from '@/components/form/asset/CreateEditAsset'

export const AssetCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    watch,
    setValue,
    setError,
    register,
    formState: { errors },
  } = useForm<IAsset, HttpError, Nullable<IAsset>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditAsset
        control={control}
        watch={watch}
        setValue={setValue}
        setError={setError}
        register={register}
        errors={errors}
        mode="standalone"
      />
    </Create>
  )
}
