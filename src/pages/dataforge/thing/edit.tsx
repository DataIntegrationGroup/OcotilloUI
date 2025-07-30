import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { IWell } from '@/interfaces/dataforge/IThing'
import { WellForm } from '@/pages/dataforge/thing/forms'

export const WellEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    formState: { errors },
  } = useForm<IWell, HttpError, Nullable<IWell>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <WellForm
        control={control}
        errors={errors}
        mode="standalone"
      />
    </Edit>
  )
}
