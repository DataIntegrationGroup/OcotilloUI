import {
  Box,
  Button,
  Stack,
  Typography,
  Card,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { Create } from '@refinedev/mui'
import { useNotification, useDataProvider } from '@refinedev/core'
import { useState } from 'react'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import InfoIcon from '@mui/icons-material/Info'

interface UploadResult {
  validation_errors: Array<{
    row: number
    field: string
    error: string
    value?: string
  }>
  summary: {
    total_rows_processed: number
    total_rows_imported: number
    validation_errors_or_warnings: number
  }
  wells: string[]
}

export const WellInventoryBulkImport: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const { open: openNotification } = useNotification()
  const dataProvider = useDataProvider()
  const provider = dataProvider('ocotillo')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      openNotification({
        message: 'No file selected',
        description: 'Please select a CSV file to upload.',
        type: 'error',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const result = await provider.custom({
        url: 'well-inventory-csv',
        method: 'post',
        payload: formData,
        headers: {},
      })

      if (result?.data) {
        setUploadResult(result.data as UploadResult)
      }

      openNotification({
        message: 'Upload successful',
        description: 'The well inventory file has been imported successfully.',
        type: 'success',
      })
      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById('csv-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      
      // Handle 422 validation errors from bulk import
      if (error.status === 422 && error.data) {
        setUploadResult(error.data as UploadResult)
        const errorCount = error.data.summary?.validation_errors_or_warnings || 0
        openNotification({
          message: 'Upload failed - Validation Errors',
          description: `${errorCount} validation error(s) found. No wells were imported.`,
          type: 'error',
        })
      } else {
        const errorMessage = error.message || 'An error occurred while uploading the file.'
        
        openNotification({
          message: 'Upload failed',
          description: errorMessage,
          type: 'error',
        })
        setUploadResult(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadResult(null)
    const fileInput = document.getElementById('csv-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <Create
      title={
        <Typography variant="h5" component="h1">
          Well Inventory Bulk Import
        </Typography>
      }
      saveButtonProps={{
        children: 'Upload',
        onClick: handleSubmit,
        disabled: !selectedFile || isSubmitting,
        loading: isSubmitting,
      }}
    >
      <Stack spacing={3}>
        {!uploadResult && (
          <>
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Upload a CSV file to bulk import well inventory data.
              </Typography>
            </Box>

            <Box>
              <label htmlFor="csv-input">
                <input
                  id="csv-input"
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <LoadingButton
                  component="span"
                  variant="outlined"
                  loading={false}
                  loadingPosition="end"
                  endIcon={<FileUploadIcon />}
                  disabled={isSubmitting}
                >
                  Select File
                </LoadingButton>
                {selectedFile && (
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    Selected file: {selectedFile.name}
                  </Typography>
                )}
              </label>
            </Box>
          </>
        )}

        {uploadResult && (
          <Card sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'left' }}>
                {uploadResult.summary.total_rows_imported > 0 ? (
                  <>
                    <Typography variant="h4" color="success.main" gutterBottom>
                      Upload Completed Successfully!
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      The well inventory file has been imported successfully.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h4" color="error.main" gutterBottom>
                      Upload Failed - Validation Errors
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      No wells were imported due to validation errors. Please review the errors below and fix your CSV file.
                    </Typography>
                  </>
                )}
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Import Summary
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
                  <Chip
                    label={`${uploadResult.summary.total_rows_processed} rows processed`}
                    color={uploadResult.summary.total_rows_imported > 0 ? "success" : "default"}
                    variant="outlined"
                  />
                  <Chip
                    label={`${uploadResult.summary.total_rows_imported} wells imported`}
                    color={uploadResult.summary.total_rows_imported > 0 ? "success" : "error"}
                    variant="outlined"
                  />
                  {uploadResult.summary.validation_errors_or_warnings > 0 && (
                    <Chip
                      label={`${uploadResult.summary.validation_errors_or_warnings} error(s)`}
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>

              {uploadResult.wells && uploadResult.wells.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Imported Wells ({uploadResult.wells.length})
                  </Typography>
                  <List
                    dense
                    sx={{
                      bgcolor: 'background.paper',
                      maxHeight: 300,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    {uploadResult.wells.map((well, index) => (
                      <div key={well}>
                        <ListItem>
                          <ListItemText primary={well} />
                        </ListItem>
                        {index < uploadResult.wells.length - 1 && <Divider />}
                      </div>
                    ))}
                  </List>
                </Box>
              )}

              {uploadResult.validation_errors &&
                uploadResult.validation_errors.length > 0 && (
                  <Box>
                    <Alert 
                      severity={uploadResult.summary.total_rows_imported > 0 ? "warning" : "error"} 
                      icon={<InfoIcon />}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Validation Errors
                      </Typography>
                      <List dense>
                        {uploadResult.validation_errors.map((error, index) => (
                          <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" component="span">
                                  <strong>Row {error.row}</strong> - <strong>{error.field}</strong>
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" component="span" sx={{ mt: 0.5, display: 'block' }}>
                                  {error.error}
                                  {error.value !== undefined && error.value !== '' && (
                                    <span> (Value: "{error.value}")</span>
                                  )}
                                </Typography>
                              }
                            />
                            {index < uploadResult.validation_errors.length - 1 && <Divider sx={{ width: '100%', mt: 1 }} />}
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  </Box>
                )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'left' }}>
                <Button variant="contained" onClick={handleReset}>
                  Select Another File
                </Button>
              </Box>
            </Stack>
          </Card>
        )}
      </Stack>
    </Create>
  )
}

