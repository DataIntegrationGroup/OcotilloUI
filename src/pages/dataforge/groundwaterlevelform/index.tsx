import React from 'react'
import Box from '@mui/material/Box'
import { useForm } from '@refinedev/react-hook-form'
import { HttpError } from '@refinedev/core'
import { IGroundwaterLevelForm } from '@/interfaces/dataforge/IGroundwaterLevel'
import { Create, useAutocomplete } from '@refinedev/mui'
import TextField from '@mui/material/TextField'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import Autocomplete from '@mui/material/Autocomplete'
import { IThing } from '@/interfaces/dataforge/IThing'
import dayjs from 'dayjs'

export const GroundwaterLevelForm: React.FC = () => {
  const {
    control,
    refineCore: { onFinish, formLoading, query },
    register,
    handleSubmit,
    formState: { errors },
    saveButtonProps,
  } = useForm<IGroundwaterLevelForm, HttpError, IGroundwaterLevelForm>({
    refineCoreProps: {
      resource: 'observation/groundwater-level',
      dataProviderName: 'dataforge',
      // action: 'edit',
      // id: 123,
    },
    defaultValues: {
      measuring_point_height: 1,
      depth_to_water: 123,
      observation_timestamp: new Date(),
      series_id: 1,
    },
  })

  const { autocompleteProps } = useAutocomplete<ILexicon>({
    resource: 'lexicon',
    dataProviderName: 'dataforge',
    meta: {
      params: { category: 'release_status' },
    },
  })

  const { autocompleteProps: autocompletePropsThing } = useAutocomplete<IThing>(
    {
      resource: 'thing',
      dataProviderName: 'dataforge',
      onSearch: (value) => [
        {
          field: 'name',
          operator: 'contains',
          value,
        },
      ],
    }
  )

  return (
    <Create goBack={<></>} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <Controller
          name="thing_id"
          control={control}
          // rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompletePropsThing}
              // value={thingValue}
              onChange={(_, newValue) => {
                // setThingValue(newValue)
                field.onChange(newValue?.id || null)
              }}
              // options={['Draft', 'Public', 'Private']}
              getOptionKey={(option) => option.id}
              getOptionLabel={(option) => option.name || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Thing"
                  margin="normal"
                  error={!!errors.thing_id}
                  helperText={errors.thing_id?.message}
                />
              )}
            />
          )}
        />

        <TextField
          {...register('depth_to_water')}
          error={!!errors.depth_to_water}
          helperText={errors.depth_to_water?.message}
          margin="normal"
          fullWidth
          label="Depth to Water (ft)"
          name="depth_to_water"
          type="number"
          autoFocus
        />
        <Controller
          name="observation_timestamp"
          control={control}
          render={({ field, fieldState }) => (
            <DateTimePicker
              {...field}
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => field.onChange(date ? date.toDate() : null)}
              label="Observation Timestamp"
              slotProps={{
                textField: {
                  margin: 'normal',
                  fullWidth: true,
                  error: !!errors.observation_timestamp,
                  helperText: errors.observation_timestamp?.message,
                },
              }}
            />
          )}
        />
        <TextField
          {...register('measuring_point_height')}
          error={!!errors.measuring_point_height}
          helperText={errors.measuring_point_height?.message}
          margin="normal"
          fullWidth
          label="Measuring Point Height (inches)"
          name="measuring_point_height"
          type="number"
          autoFocus
        />
        <Controller
          name="release_status"
          control={control}
          rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompleteProps}
              // value={thingValue}
              onChange={(_, newValue) => {
                // setThingValue(newValue)
                field.onChange(newValue?.term || null)
              }}
              // options={['Draft', 'Public', 'Private']}
              // getValue={(option) => option.term}
              getOptionKey={(option) => option.term}
              getOptionLabel={(option) => option.term || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Release Status"
                  margin="normal"
                  error={!!errors.release_status}
                  helperText={errors.release_status?.message}
                />
              )}
            />
          )}
        />
      </Box>
    </Create>
  )
  // <form onSubmit={handleSubmit(onFinish)}>
  //   <label>
  //     Name:
  //     <input {...register('name')} />
  //   </label>
  //   <label>
  //     Material:
  //     <input {...register('material')} />
  //   </label>
  //   <button type="submit">Submit</button>
  // </form>
}
