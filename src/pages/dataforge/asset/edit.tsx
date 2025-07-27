import { HttpError, useOne } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'
import CircularProgress from '@mui/material/CircularProgress'
import type { Nullable } from '@/interfaces'
import { IAsset } from '@/interfaces/dataforge/IAsset'
import { useState } from 'react'

export const AssetEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    formState: { errors },
  } = useForm<IAsset, HttpError, Nullable<IAsset>>()

  // const { autocompleteProps } = useAutocomplete<ICategory>({
  //   resource: "categories",
  //   defaultValue: queryResult?.data?.data.category.id,
  // });
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
  // const [imgLoading, setImgLoading] = useState(true)

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('label', {
            required: 'This field is required',
          })}
          // disabled
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Label"
          name="label"
          autoFocus
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>
      {isLoading && (
        <CircularProgress size={48} sx={{ position: 'absolute', zIndex: 1 }} />
      )}
      <Box
        component="img"
        sx={{
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        src={image?.url}
        alt="Asset"
      />
    </Edit>
  )
}
