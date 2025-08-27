
import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'

import { useForm } from '@refinedev/react-hook-form'
import { CreateEditWellScreen } from '@/components/form/thing/CreateEditWellScreen'
import type { Nullable } from '@/interfaces'
import { IWellScreen } from '@/interfaces/ocotillo/IWellScreen'

export const WellScreenEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    setValue,
    formState: { errors },
  } = useForm<IWellScreen, HttpError, Nullable<IWellScreen>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditWellScreen
        control={control}
        errors={errors}
        setValue={setValue}
        mode="standalone"
      />
    </Edit>
  )
}

