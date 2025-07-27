import type { HttpError } from '@refinedev/core'
import { Edit } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { useForm } from '@refinedev/react-hook-form'

import type { Nullable } from '@/interfaces'
import { IAsset } from '@/interfaces/dataforge/IAsset'

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

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('name', {
            required: 'This field is required',
          })}
          // disabled
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          autoFocus
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>
    </Edit>
  )
}
