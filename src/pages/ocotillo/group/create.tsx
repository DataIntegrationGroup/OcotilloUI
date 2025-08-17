import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm } from '@refinedev/react-hook-form'

import { Controller } from 'react-hook-form'

import { Nullable } from '../../../interfaces'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import { useState } from 'react'
import { IThing } from '@/interfaces/ocotillo/IThing'
import { CreateEditGroup } from '@/components/form/group/CreateEditGroup'

export const GroupCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<IGroup, HttpError, Nullable<IGroup>>()

  const { autocompleteProps } = useAutocomplete<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  return (
    <Create saveButtonProps={saveButtonProps}>
      <CreateEditGroup
        errors={errors}
        control={control}
        register={register}
        setValue={setValue}
        mode={'standalone'}
      />
    </Create>
  )
}
