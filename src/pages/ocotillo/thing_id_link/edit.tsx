import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { IThingIdLink } from '@/interfaces/ocotillo/IThing'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'
import { CreateEditThingIdLink } from '@/components/form/thing/CreateEditThingIdLink'

export const ThingIdLinkEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<IThingIdLink, HttpError, Nullable<IThingIdLink>>()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditThingIdLink
        register={register}
        watch={watch}
        control={control}
        errors={errors}
      />
    </Edit>
  )
}
