import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { ITerm, ICategory } from '@/interfaces/ocotillo/ILexicon'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { CreateEditTerm } from '@/components/form/lexicon/CreateEditTerm'
import { CreateEditCategory } from '@/components/form/lexicon/CreateEditCategory'

export const CategoryEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<ICategory, HttpError, Nullable<ICategory>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditCategory control={control} errors={errors} />
    </Edit>
  )
}
export const TermEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<ITerm, HttpError, Nullable<ITerm>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditTerm control={control} errors={errors} />
    </Edit>
  )
}
