import { HttpError, useOne } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import CircularProgress from '@mui/material/CircularProgress'
import type { Nullable } from '@/interfaces'
import { IAsset } from '@/interfaces/ocotillo/IAsset'
import { useState } from 'react'
import { CreateEditAsset } from '@/components/form/asset/CreateEditAsset'

export const AssetEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query },
    control,
    watch,
    setValue,
    setError,
    register,
    formState: { errors },
  } = useForm<IAsset, HttpError, Nullable<IAsset>>()

  const { result: image } = useOne({
    resource: 'asset',
    id: query?.data?.data.id,
    dataProviderName: 'ocotillo',
    queryOptions: {
      gcTime: 0,
      staleTime: 0,
    },
  })

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <CreateEditAsset
        control={control}
        watch={watch}
        setValue={setValue}
        setError={setError}
        register={register}
        errors={errors}
        mode="standalone"
        existingAsset={image}
      />
    </Edit>
  )
}
