import {
  HttpError,
  useDataProvider,
} from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { Controller } from 'react-hook-form'
import {
  Box,
  TextField,
  Stack,
  Typography,
  Input,
  Button,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { Add, Delete } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'
import { useState } from 'react'

import { Nullable } from '@/interfaces'
import { IAsset } from '@/interfaces/dataforge/IAsset'

interface CreateEditAssetProps {
  control: any
  watch?: any
  setValue?: any
  setError?: any
  register?: any
  errors?: any
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
  // Asset-level array management (for multiple assets)
  assetIndex?: number
  onRemoveAsset?: (index: number) => void
  onAddAsset?: (asset: any) => void
  canRemoveAsset?: boolean
  totalAssets?: number
}

export const CreateEditAsset: React.FC<CreateEditAssetProps> = ({
  control,
  watch,
  setValue,
  setError,
  register,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
  assetIndex,
  onRemoveAsset,
  onAddAsset,
  canRemoveAsset = true,
  totalAssets = 1
}) => {
  const [isUploadLoading, setIsUploadLoading] = useState(false)

  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

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
      setValue(getFieldName('file'), imagePayload, { shouldValidate: true })
      setValue(getFieldName('name'), name, { shouldValidate: true })
      setValue(getFieldName('storage_path'), asset.storage_path, { shouldValidate: true })
      setValue(getFieldName('mime_type'), type, { shouldValidate: true })
      setValue(getFieldName('size'), size, { shouldValidate: true })
      setValue(getFieldName('url'), asset.url, { shouldValidate: true })
      setIsUploadLoading(false)
    } catch (error) {
      console.log(error)
      setError(getFieldName('file'), { message: 'Upload failed. Please try again.' })
      setIsUploadLoading(false)
    }
  }

  const imageInput = watch ? watch(getFieldName('file')) : null

  return (
    <Grid container spacing={3}>
      {/* Asset Header with Remove Button */}
      {assetIndex !== undefined && (
        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Asset {assetIndex + 1}</Typography>
            {onRemoveAsset && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => onRemoveAsset(assetIndex)}
                startIcon={<Delete />}
                disabled={!canRemoveAsset}
              >
                Remove Asset
              </Button>
            )}
          </Box>
        </Grid>
      )}

      {/* Asset Label */}
      <Grid size={12}>
        <Controller
          name={getFieldName('label')}
          control={control}
          rules={{ required: 'This field is required' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Asset Label"
              fullWidth
              margin="normal"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              required
            />
          )}
        />
      </Grid>



      {/* File Upload Section */}
      <Grid size={12}>
        <Stack
          direction="column"
          gap={4}
          flexWrap="wrap"
          sx={{ marginTop: '16px' }}
        >
          <label htmlFor={`images-input-${assetIndex || 'standalone'}`}>
            <Input
              id={`images-input-${assetIndex || 'standalone'}`}
              type="file"
              sx={{ display: 'none' }}
              onChange={onChangeHandler}
            />
            <input
              id={getFieldName('file')}
              {...(register ? register(getFieldName('file'), {
                required: 'This field is required',
              }) : {})}
              type="hidden"
            />
            <LoadingButton
              loading={isUploadLoading}
              loadingPosition="end"
              endIcon={<FileUploadIcon />}
              variant="contained"
              component="span"
            >
              Upload File
            </LoadingButton>
            <br />
            {errors && errors[getFieldName('file')] && (
              <Typography variant="caption" color="#fa541c">
                {errors[getFieldName('file')]?.message?.toString()}
              </Typography>
            )}
          </label>
          {imageInput && (
            <Box
              component="img"
              sx={{
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
              }}
              src={imageInput[0].url}
              alt={imageInput[0].name}
            />
          )}
        </Stack>
      </Grid>

      {/* Add Asset Button - Show on last asset only */}
      {onAddAsset && assetIndex === totalAssets - 1 && (
        <Grid size={12}>
          <Button
            variant="outlined"
            onClick={() => onAddAsset({
              label: '',
              name: '',
              thing_id: null,
              file: null,
              storage_path: '',
              mime_type: '',
              size: 0,
              url: ''
            })}
            startIcon={<Add />}
          >
            Add Asset
          </Button>
        </Grid>
      )}
    </Grid>
  )
} 