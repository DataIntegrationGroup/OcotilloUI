import { HttpError, useApiUrl } from '@refinedev/core'
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
import { Input, Stack, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
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
  const apiUrl = useApiUrl()

  const [thingValue, setThingValue] = useState<IThing | null>(null)
  const { autocompleteProps } = useAutocomplete<IThing>({
    resource: 'thing',
    dataProviderName: 'dataforge',
  })

  const onChangeHandler = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setIsUploadLoading(true)

      const formData = new FormData()

      const target = event.target
      const file: File = (target.files as FileList)[0]

      formData.append('file', file)

      const res = await axios.post<{
        storage_path: string
        url: string
      }>(`${apiUrl}/asset/upload`, formData, {
        withCredentials: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })

      const { name, size, type, lastModified } = file

      // setAssetValue({
      //   name,
      //   size,
      //   mimetype: type,
      //   storage_path: res.data.url,
      // })
      const imagePayload = [
        {
          name,
          size,
          type,
          lastModified,
          url: res.data.url,
        },
      ]
      setValue('file', imagePayload, { shouldValidate: true })
      setValue('name', name, { shouldValidate: true })
      setValue('storage_path', res.data.storage_path, { shouldValidate: true })
      setValue('mime_type', type, { shouldValidate: true })
      setValue('size', size, { shouldValidate: true })
      setValue('url', res.data.url, { shouldValidate: true })
      setIsUploadLoading(false)
    } catch (error) {
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
          <LoadingButton
            loading={isUploadLoading}
            loadingPosition="end"
            endIcon={<FileUploadIcon />}
            variant="contained"
            component="span"
          >
            Upload
          </LoadingButton>
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
            alt="Post image"
          />
        )}
      </Stack>
    </Create>
  )
}
