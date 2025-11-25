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
  Link,
} from '@mui/material'
import { Create } from '@refinedev/mui'
import { useNotification, useDataProvider } from '@refinedev/core'
import { useState, useMemo } from 'react'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import InfoIcon from '@mui/icons-material/Info'
import { DataGrid, type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import Papa from 'papaparse'
import { parseCSV } from '@/utils/ParseCSV'
import { validateAllRows, allFieldNames } from './utils'
import { wellInventoryRowSchema, type WellInventoryRow } from './schema'
import { createGridColumns } from './grid-defs'

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

export interface TableRow extends Omit<WellInventoryRow, 'utm_easting' | 'utm_northing' | 'utm_zone' | 'elevation_ft' | 'measuring_point_height_ft'> {
  id: number
  _errors?: string[]
  utm_easting?: number | string
  utm_northing?: number | string
  utm_zone?: string 
  elevation_ft?: number | string
  measuring_point_height_ft?: number | string
}

export const WellInventoryBulkImport: React.FC = () => {
  const [rows, setRows] = useState<TableRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<Map<number, string[]>>(new Map())
  const [fieldErrors, setFieldErrors] = useState<Map<string, Set<string>>>(new Map()) // Map of "rowId-fieldName" to error messages
  const { open: openNotification } = useNotification()
  const dataProvider = useDataProvider()
  const provider = dataProvider('ocotillo')

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const parsedRows = await parseCSV<WellInventoryRow>(file, allFieldNames)
      const newRows: TableRow[] = parsedRows.map((row, index) => ({
        ...row,
        id: Date.now() + index,
      }))
      setRows(newRows)
      
      // Validate imported rows
      const errors = validateAllRows(newRows)
      const errorMap = new Map<number, string[]>()
      const fieldErrorMap = new Map<string, Set<string>>()
      
      errors.forEach(({ rowIndex, errors }) => {
        const tableRow = newRows[rowIndex - 1]
        if (tableRow) {
          errorMap.set(tableRow.id, errors)
          
          // Extract field-level errors
          errors.forEach(error => {
            const match = error.match(/^([^:]+):\s*(.+)$/)
            if (match) {
              const fieldName = match[1].trim()
              const errorMessage = match[2].trim()
              const key = `${tableRow.id}-${fieldName}`
              if (!fieldErrorMap.has(key)) {
                fieldErrorMap.set(key, new Set())
              }
              fieldErrorMap.get(key)!.add(errorMessage)
            }
          })
        }
      })
      setValidationErrors(errorMap)
      setFieldErrors(fieldErrorMap)
      
      openNotification({
        message: 'CSV data added to table',
        description: `Added ${newRows.length} row(s) to the table from the CSV file. Please review and fix any errors before submitting.`,
        type: 'success',
      })
    } catch (error: any) {
      openNotification({
        message: 'CSV data add to table failed',
        description: error.message || 'Failed to parse CSV file',
        type: 'error',
      })
    }
    
    // Reset file input
    event.target.value = ''
  }

  const handleDeleteRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id))
    const newErrors = new Map(validationErrors)
    newErrors.delete(id)
    setValidationErrors(newErrors)
    
    // Clear field errors for this row
    const newFieldErrors = new Map(fieldErrors)
    Array.from(newFieldErrors.keys())
      .filter(key => key.startsWith(`${id}-`))
      .forEach(key => newFieldErrors.delete(key))
    setFieldErrors(newFieldErrors)
  }

  const processRowUpdate = (newRow: GridRowModel): GridRowModel => {
    const updatedRows = rows.map((row) => (row.id === newRow.id ? (newRow as TableRow) : row))
    setRows(updatedRows)
    
    // Validate the updated row
    const validation = wellInventoryRowSchema.safeParse(newRow)
    const errorMap = new Map(validationErrors)
    const fieldErrorMap = new Map(fieldErrors)
    
    // Clear existing errors for this row
    Array.from(fieldErrorMap.keys())
      .filter(key => key.startsWith(`${newRow.id}-`))
      .forEach(key => fieldErrorMap.delete(key))
    
    const errors: string[] = []
    
    if (!validation.success) {
      validation.error.issues.forEach(err => {
        const field = err.path.join('.')
        const errorMsg = `${field}: ${err.message}`
        errors.push(errorMsg)
        
        // Track field-level error
        const key = `${newRow.id}-${field}`
        if (!fieldErrorMap.has(key)) {
          fieldErrorMap.set(key, new Set())
        }
        fieldErrorMap.get(key)!.add(err.message)
      })
    }
    
    if (errors.length > 0) {
      errorMap.set(newRow.id, errors)
    } else {
      errorMap.delete(newRow.id)
    }
    
    setValidationErrors(errorMap)
    setFieldErrors(fieldErrorMap)
    return newRow
  }

 /*
  * Handle submit to return rows to csv and upload to the API
 */
  const handleSubmit = async () => {
    if (rows.length === 0) {
      openNotification({
        message: 'No data to submit',
        description: 'Please add rows to the table or import a CSV file.',
        type: 'error',
      })
      return
    }

    // Validate all rows before submission
    const errors = validateAllRows(rows)
    if (errors.length > 0) {
      const errorMap = new Map<number, string[]>()
      errors.forEach(({ rowIndex, errors }) => {
        const tableRow = rows[rowIndex - 1]
        if (tableRow) {
          errorMap.set(tableRow.id, errors)
        }
      })
      setValidationErrors(errorMap)
      
      openNotification({
        message: 'Validation errors found',
        description: `Please fix ${errors.length} validation error(s) before submitting.`,
        type: 'error',
      })
      return
    }

    setIsSubmitting(true)

    try {
        // Convert rows to CSV format
        const csvContent = convertRowsToCSV(rows)
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const file = new File([blob], 'well-inventory.csv', { type: 'text/csv' })
    
        const formData = new FormData()
        formData.append('file', file)
    
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
      } catch (error: any) {
        console.error('Error uploading file:', error)
        
        // Handle 422 validation errors from bulk import
        if (error.status === 422 && error.data) {
          const apiErrors = error.data as UploadResult
          const errorCount = apiErrors.summary?.validation_errors_or_warnings || 0
          
          // Map API validation errors back to table rows
          const errorMap = new Map<number, string[]>()
          const fieldErrorMap = new Map<string, Set<string>>()
          
          if (apiErrors.validation_errors) {
            apiErrors.validation_errors.forEach((apiError) => {
              // API errors have row numbers (1-based), match to table rows
              const tableRow = rows[apiError.row - 1] // Convert to 0-based index
              if (tableRow) {
                const existingErrors = errorMap.get(tableRow.id) || []
                const errorMsg = `${apiError.field}: ${apiError.error}`
                errorMap.set(tableRow.id, [...existingErrors, errorMsg])
                
                // Track field-level error
                const key = `${tableRow.id}-${apiError.field}`
                if (!fieldErrorMap.has(key)) {
                  fieldErrorMap.set(key, new Set())
                }
                fieldErrorMap.get(key)!.add(apiError.error)
              }
            })
          }
          
          setValidationErrors(errorMap)
          setFieldErrors(fieldErrorMap)          
          openNotification({
            message: 'Import failed - Validation Errors',
            description: `${errorCount} validation error(s) found. Please fix the errors in the table and try again.`,
            type: 'error',
          })
        } else {
          const errorMessage = error.message || 'An error occurred while uploading the file.'
          
          openNotification({
            message: 'Import failed',
            description: errorMessage,
            type: 'error',
          })
        }
      } finally {
        setIsSubmitting(false)
      }
  }

  const handleReset = () => {
    setRows([])
    setUploadResult(null)
    setValidationErrors(new Map())
    const fileInput = document.getElementById('csv-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const convertRowsToCSV = (rows: TableRow[]): string => {
    // Convert TableRow to WellInventoryRow (remove id and _errors)
    const csvData = rows.map((row) => {
      const csvRow: any = {}
      allFieldNames.forEach((fieldName) => {
        let value = row[fieldName as keyof WellInventoryRow]
        
        // Convert undefined/null to empty string (Papa.unparse would output "undefined"/"null" otherwise)
        csvRow[fieldName] = value == null ? '' : String(value)
      })
      return csvRow
    })

    return Papa.unparse(csvData, {
      columns: allFieldNames,
    })
  }

  const columns = useMemo(() => {
    const getCellError = (rowId: number, fieldName: string): boolean => {
      return fieldErrors.has(`${rowId}-${fieldName}`)
    }
    
    return createGridColumns(getCellError, handleDeleteRow)
  }, [fieldErrors, handleDeleteRow])

  const hasValidationErrors = validationErrors.size > 0
  const errorCount = validationErrors.size

  return (
    <Create
      title={
        <Typography variant="h5" component="h1">
          Well Inventory Bulk Import
        </Typography>
      }
      saveButtonProps={{
        children: 'Submit',
        onClick: handleSubmit,
        disabled: rows.length === 0 || isSubmitting || hasValidationErrors,
        loading: isSubmitting,
        sx: { display: 'none'}
      }}
    >
      <Stack spacing={3}>
        {!uploadResult && (
          <>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upload a CSV file to validate your well inventory data and submit in bulk.
              </Typography>
              <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  All fields are editable. Scroll horizontally to see additional columns. Data will not be saved until you submit.
                  <br />
                  If validation fails on submission, the table will be updated to show the errors and you will be able to fix the errors and submit again.
                  <br />
                  Well screens and well attachments are not supported in this bulk import.
                </Typography>
              </Alert>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="csv-input">
                <input
                  id="csv-input"
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleCSVImport}
                />
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<FileUploadIcon />}
                  disabled={isSubmitting}
                >
                  Upload CSV
                </Button>
              </label>
              <Link
                href="https://docs.google.com/spreadsheets/d/1USYvb-A_-jsdY3qoPQBdkfjv5jjjYGaympp8SMAqJDo/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                <Button
                  variant="outlined"
                  disabled={isSubmitting}
                >
                  CSV Template
                </Button>
              </Link>
              <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={rows.length === 0 || isSubmitting || hasValidationErrors}
                  loading={isSubmitting}
                >
                  Submit
              </Button>
              {rows.length > 0 && (
                <Chip
                  label={`${rows.length} row(s)`}
                  color="primary"
                  variant="outlined"
                />
              )}
              {hasValidationErrors && (
                <Chip
                  label={`${errorCount} error(s)`}
                  color="error"
                  variant="outlined"
                />
              )}
              {rows.length > 0 && !hasValidationErrors && (
                <Chip
                  label="No missing fields found - ready to attempt submission"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>

            {hasValidationErrors && (
              <Alert severity="error" icon={<InfoIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Validation Errors Found
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Please fix the errors in the table before submitting. Errors are highlighted in red.
                </Typography>
                <List dense sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
                  {Array.from(validationErrors.entries()).map(([rowId, errors]) => {
                    const row = rows.find(r => r.id === rowId)
                    const rowNumber = rows.findIndex(r => r.id === rowId) + 1
                    return (
                      <ListItem key={rowId} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Row {rowNumber} - {(row as TableRow)?.well_name_point_id || 'Unnamed'}
                        </Typography>
                        {errors.map((error, index) => (
                          <Typography key={index} variant="body2" color="error" sx={{ ml: 2 }}>
                            • {error}
                          </Typography>
                        ))}
                      </ListItem>
                    )
                  })}
                </List>
              </Alert>
            )}

            {rows.length >= 0 && (
              <Card>
                <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={(error) => {
                      console.error('Row update error:', error)
                    }}
                    getRowClassName={(params) => {
                      return validationErrors.has(params.row.id) ? 'error-row' : ''
                    }}
                    disableRowSelectionOnClick
                    slots={{
                        noRowsOverlay: () => (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography>No rows to display. Import a CSV file to get started.</Typography>
                          </Box>
                        )
                      }}
                    sx={{
                      '& .error-row': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.12)',
                        },
                      },
                      '& .error-cell': {
                        backgroundColor: 'rgba(211, 47, 47, 0.2) !important',
                        border: '2px solid #d32f2f',
                        '&:focus': {
                          backgroundColor: 'rgba(211, 47, 47, 0.3) !important',
                        },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="caption" color="text.secondary">
                    Note: All fields are editable. Scroll horizontally to see additional columns.
                  </Typography>
                </Box>
              </Card>
            )}

          </>
        )}

        {uploadResult && (
          <Card sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'left' }}>
                {uploadResult.summary.total_rows_imported > 0 ? (
                  <>
                    <Typography variant="h4" color="success.main" gutterBottom>
                      Import Completed Successfully!
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      The well inventory data has been imported successfully.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h4" color="error.main" gutterBottom>
                      Import Failed - Validation Errors
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

