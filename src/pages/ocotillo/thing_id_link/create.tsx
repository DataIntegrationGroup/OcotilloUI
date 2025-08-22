import type { HttpError } from '@refinedev/core'
import { Create, DateField } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import { Nullable } from '../../../interfaces'
import { IThingIdLink } from '@/interfaces/ocotillo/IThing'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import { SelectThingComponent } from '@/components/form/thing/SelectThingComponent'
import { ControlledSelectField } from '@/components'
import { CreateEditThingIdLink } from '@/components/form/thing/CreateEditThingIdLink'

export const ThingIdLinkCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<IThingIdLink, HttpError, Nullable<IThingIdLink>>()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditThingIdLink
        register={register}
        watch={watch}
        control={control}
        errors={errors}
      />
    </Create>
  )
}
