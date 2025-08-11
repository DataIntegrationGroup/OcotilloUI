import { useAutocomplete } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { IGroup } from '@/interfaces/dataforge/IGroup'
import { Controller } from 'react-hook-form'
import { Autocomplete } from '@mui/material'

export const CreateEditGroup = ({ control, register, errors, mode }) => {
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
    <>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('name', {
            required: 'This field is required',
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
          margin="normal"
          fullWidth
          label="Name"
          name="name"
          autoFocus
        />
      </Box>
      <Controller
        name="parent_group_id"
        control={control}
        // rules={{ required: 'This field is required' }}
        render={({ field }) => (
          <Autocomplete
            {...autocompleteProps}
            onChange={(_, newValue) => {
              field.onChange(newValue?.id || null)
            }}
            getOptionKey={(option) => option.id}
            getOptionLabel={(option) => option.name || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Parent Group"
                margin="normal"
                error={!!errors.parent_group_id}
                helperText={errors.parent_group_id?.message}
              />
            )}
          />
        )}
      />
    </>
  )
}
