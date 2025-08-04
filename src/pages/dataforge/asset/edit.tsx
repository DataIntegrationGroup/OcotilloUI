import { HttpError, useOne } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import CircularProgress from '@mui/material/CircularProgress'
import type { Nullable } from '@/interfaces'
import { IAsset } from '@/interfaces/dataforge/IAsset'
import { useState } from 'react'
import { CreateEditAsset } from '@/components/form/asset/CreateEditAsset'

export const AssetEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    control,
    watch,
    setValue,
    setError,
    register,
    formState: { errors },
  } = useForm<IAsset, HttpError, Nullable<IAsset>>()

  const { data, isLoading, isError } = useOne({
    resource: 'asset',
    id: queryResult?.data?.data.id,
    dataProviderName: 'dataforge',
    queryOptions: {
      cacheTime: 10 * 60 * 1000, // 10 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  })

  const image = data?.data

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
