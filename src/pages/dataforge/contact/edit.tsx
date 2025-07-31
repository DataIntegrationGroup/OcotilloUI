import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { IContact } from '@/interfaces/dataforge/IContact'
import { CreateEditContact } from '@/components/form/contact/CreateEditContact'

export const ContactEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    formState: { errors },
  } = useForm<IContact, HttpError, Nullable<IContact>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditContact
        control={control}
        errors={errors}
        mode="standalone"
        showDynamicArrays={true}
      />
    </Edit>
  )
}
