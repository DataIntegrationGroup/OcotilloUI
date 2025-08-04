import {
  HttpError,
  useApiUrl,
  useCreate,
  useDataProvider,
} from '@refinedev/core'
import { Create, useAutocomplete } from '@refinedev/mui'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'

import { Nullable } from '../../../interfaces'
import { IAsset } from '@/interfaces/dataforge/IAsset'
import { useCallback, useState } from 'react'
import axios from 'axios'
import { Input, Stack, Typography, Button } from '@mui/material'
// import { LoadingButton } from '@mui/lab'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { IThing } from '@/interfaces/dataforge/IThing'

export const AssetCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
    setValue,
    setError,
    watch,
  } = useForm<IAsset, HttpError, Nullable<IAsset>>()
  const [isUploadLoading, setIsUploadLoading] = useState(false)

  const [thingValue, setThingValue] = useState<IThing | null>(null)
  const { autocompleteProps } = useAutocomplete<IThing>({
    resource: 'thing',
    dataProviderName: 'dataforge',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  const dataProvider = useDataProvider()
  const provider = dataProvider('dataforge')

  const onChangeHandler = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setIsUploadLoading(true)

      const target = event.target
      const file: File = (target.files as FileList)[0]

      const formData = new FormData()
      formData.append('file', file)

      const asset = await provider
        .custom({
          url: 'asset/upload',
          method: 'post',
          payload: formData,
          headers: {
            'Content-Type': file.type,
          },
        })
        .then((res) => {
          if (res.data) {
            return res.data
          } else {
            throw new Error('Upload failed')
          }
        })
        .catch((error) => {
          setError('file', { message: error.message })
          setIsUploadLoading(false)
          throw error
        })

      const { name, size, type, lastModified } = file
      const imagePayload = [
        {
          name,
          size,
          type,
          lastModified,
          url: asset.url,
        },
      ]
      setValue('file', imagePayload, { shouldValidate: true })
      setValue('name', name, { shouldValidate: true })
      setValue('storage_path', asset.storage_path, { shouldValidate: true })
      setValue('mime_type', type, { shouldValidate: true })
      setValue('size', size, { shouldValidate: true })
      setValue('url', asset.url, { shouldValidate: true })
      setIsUploadLoading(false)
    } catch (error) {
      console.log(error)
      setError('file', { message: 'Upload failed. Please try again.' })
      setIsUploadLoading(false)
    }
  }

  const imageInput = watch('file')

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('label', {
            required: 'This field is required',
          })}
          error={!!errors.label}
          helperText={errors.label?.message}
          margin="normal"
          fullWidth
          label="Label"
          name="label"
          autoFocus
        />
        <Controller
          name="thing_id"
          control={control}
          // rules={{ required: 'This field is required' }}
          render={({ field }) => (
            <Autocomplete
              {...autocompleteProps}
              value={thingValue}
              onChange={(_, newValue) => {
                setThingValue(newValue)
                field.onChange(newValue?.id || null)
              }}
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
      </Box>
      {/*<TextField*/}
      {/*  {...register('file', {*/}
      {/*    required: 'This field is required',*/}
      {/*  })}*/}
      {/*  error={!!errors.file}*/}
      {/*  helperText={errors.file?.message}*/}
      {/*  margin="normal"*/}
      {/*  label="Content"*/}
      {/*  multiline*/}
      {/*  rows={4}*/}
      {/*/>*/}
      <Stack
        direction="column"
        gap={4}
        flexWrap="wrap"
        sx={{ marginTop: '16px' }}
      >
        <label htmlFor="images-input">
          <Input
            id="images-input"
            type="file"
            sx={{ display: 'none' }}
            onChange={onChangeHandler}
          />
          <input
            id="file"
            {...register('file', {
              required: 'This field is required',
            })}
            type="hidden"
          />
          <Button
            loading={isUploadLoading}
            loadingPosition="end"
            endIcon={<FileUploadIcon />}
            variant="contained"
            component="span"
          >
            Upload
          </Button>
          <br />
          {errors.file && (
            <Typography variant="caption" color="#fa541c">
              {errors.file?.message?.toString()}
            </Typography>
          )}
        </label>
        {imageInput && (
          <Box
            component="img"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            src={imageInput[0].url}
            alt={imageInput[0].name}
          />
        )}
      </Stack>
    </Create>
  )
}
