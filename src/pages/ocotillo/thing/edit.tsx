import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { IWell } from '@/interfaces/ocotillo'
import { CreateEditWell } from '@/components/form/thing/CreateEditWell'

export const WellEdit: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<IWell, HttpError, Nullable<IWell>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditWell control={control} errors={errors} mode="standalone" />
    </Edit>
  )
}
