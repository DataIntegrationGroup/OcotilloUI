import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'

import { useForm } from '@refinedev/react-hook-form'
import { CreateEditGroup } from '@/components/form/group/CreateEditGroup'
import type { Nullable } from '@/interfaces'
import { IGroup } from '@/interfaces/ocotillo/IGroup'

export const GroupEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<IGroup, HttpError, Nullable<IGroup>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditGroup
        register={register}
        control={control}
        errors={errors}
        setValue={setValue}
        mode="standalone"
      />
    </Edit>
  )
}
