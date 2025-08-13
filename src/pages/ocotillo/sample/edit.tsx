import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { ISample } from '@/interfaces/ocotillo/ISample'
import { CreateEditSample } from '@/components/form/sample/CreateEditSample'

export const SampleEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    formState: { errors },
  } = useForm<ISample, HttpError, Nullable<ISample>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditSample control={control} errors={errors} mode="standalone" />
    </Edit>
  )
}
