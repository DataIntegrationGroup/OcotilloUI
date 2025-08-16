import type { HttpError } from '@refinedev/core'
import { Create, DateField } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { ICategory, ITerm } from '@/interfaces/ocotillo/ILexicon'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import { SelectThingComponent } from '@/components/form/thing/SelectThingComponent'
import { ControlledSelectField } from '@/components'
import { CreateEditCategory } from '@/components/form/lexicon/CreateEditCategory'
import { CreateEditTerm } from '@/components/form/lexicon/CreateEditTerm'
// import { CreateEditTerm } from '@/components/form/thing/CreateEditTerm'

export const CategoryCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<ICategory, HttpError, Nullable<ICategory>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditCategory control={control} errors={errors} />
    </Create>
  )
}
export const TermCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<ITerm, HttpError, Nullable<ITerm>>()

  return (
    <Create resource={'lexicon/term'} saveButtonProps={saveButtonProps}>
      <CreateEditTerm control={control} errors={errors} />
    </Create>
  )
}
