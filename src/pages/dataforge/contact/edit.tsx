import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { IContact } from '@/interfaces/dataforge/IContact'
import { ContactForm } from './forms'

export const ContactEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    formState: { errors },
  } = useForm<IContact, HttpError, Nullable<IContact>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <ContactForm
        control={control}
        errors={errors}
        mode="standalone"
        showDynamicArrays={true}
      />
    </Edit>
  )
}
