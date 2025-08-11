import type { HttpError } from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm } from '@refinedev/react-hook-form'

import { Controller } from 'react-hook-form'

import { Nullable } from '../../../interfaces'
import { IGroup } from '@/interfaces/dataforge/IGroup'
import { useState } from 'react'
import { IThing } from '@/interfaces/dataforge/IThing'
import { CreateEditGroup } from '@/components/form/group/CreateEditGroup'

export const GroupCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<IGroup, HttpError, Nullable<IGroup>>()

  const { autocompleteProps } = useAutocomplete<IGroup>({
    resource: 'group',
    dataProviderName: 'dataforge',
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
        mode={'standalone'}
      />
    </Create>
  )
}
