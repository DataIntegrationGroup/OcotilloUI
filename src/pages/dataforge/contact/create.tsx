import type { HttpError } from '@refinedev/core'
import { Create } from '@refinedev/mui'
import { useForm } from '@refinedev/react-hook-form'

import { Nullable } from '../../../interfaces'
import { IContact } from '@/interfaces/dataforge/IContact'
import { ContactForm } from './forms'

export const ContactCreate: React.FC = () => {
  const {
    saveButtonProps,
    control,
    formState: { errors },
  } = useForm<IContact, HttpError, Nullable<IContact>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <ContactForm
        control={control}
        errors={errors}
        mode="standalone"
        showDynamicArrays={true}
      />
    </Create>
  )
}
