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
  IconButton,
  Tooltip,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { Create } from '@refinedev/mui'
import { useNotification, useDataProvider } from '@refinedev/core'
import { useState, useMemo } from 'react'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { DataGrid, type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import { parseCSV, validateAllRows } from './utils'
import { wellInventoryRowSchema, type WellInventoryRow } from './schema'

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

interface TableRow extends Omit<WellInventoryRow, 'utm_easting' | 'utm_northing' | 'utm_zone' | 'elevation_ft' | 'measuring_point_height_ft'> {
  id: number
  _errors?: string[]
  utm_easting?: number | string
  utm_northing?: number | string
  utm_zone?: number | string
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
      const parsedRows = await parseCSV(file)
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
        description: `Imported ${newRows.length} row(s) to the table below. Please review and fix any validation errors.`,
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

  const handleAddRow = () => {
    const newRow: TableRow = {
      id: Date.now(),
      // Required fields
      project: '',
      well_name_point_id: '',
      site_name: '',
      date_time: '',
      field_staff: '',
      utm_easting: '',
      utm_northing: '',
      utm_zone: '',
      elevation_ft: '',
      elevation_method: '',
      measuring_point_height_ft: '',
      // Optional fields - initialize as empty strings
      field_staff_2: '',
      field_staff_3: '',
      contact_1_name: '',
      contact_1_organization: '',
      contact_1_role: '',
      contact_1_type: '',
      contact_1_phone_1: '',
      contact_1_phone_1_type: '',
      contact_1_phone_2: '',
      contact_1_phone_2_type: '',
      contact_1_email_1: '',
      contact_1_email_1_type: '',
      contact_1_email_2: '',
      contact_1_email_2_type: '',
      contact_1_address_1_line_1: '',
      contact_1_address_1_line_2: '',
      contact_1_address_1_type: '',
      contact_1_address_1_state: '',
      contact_1_address_1_city: '',
      contact_1_address_1_postal_code: '',
      contact_1_address_2_line_1: '',
      contact_1_address_2_line_2: '',
      contact_1_address_2_type: '',
      contact_1_address_2_state: '',
      contact_1_address_2_city: '',
      contact_1_address_2_postal_code: '',
      contact_2_name: '',
      contact_2_organization: '',
      contact_2_role: '',
      contact_2_type: '',
      contact_2_phone_1: '',
      contact_2_phone_1_type: '',
      contact_2_phone_2: '',
      contact_2_phone_2_type: '',
      contact_2_email_1: '',
      contact_2_email_1_type: '',
      contact_2_email_2: '',
      contact_2_email_2_type: '',
      contact_2_address_1_line_1: '',
      contact_2_address_1_line_2: '',
      contact_2_address_1_type: '',
      contact_2_address_1_state: '',
      contact_2_address_1_city: '',
      contact_2_address_1_postal_code: '',
      contact_2_address_2_line_1: '',
      contact_2_address_2_line_2: '',
      contact_2_address_2_type: '',
      contact_2_address_2_state: '',
      contact_2_address_2_city: '',
      contact_2_address_2_postal_code: '',
      directions_to_site: '',
      specific_location_of_well: '',
      repeat_measurement_permission: '',
      sampling_permission: '',
      datalogger_installation_permission: '',
      public_availability_acknowledgement: '',
      result_communication_preference: '',
      contact_special_requests_notes: '',
      ose_well_record_id: '',
      date_drilled: '',
      completion_source: '',
      total_well_depth_ft: undefined,
      historic_depth_to_water_ft: undefined,
      depth_source: '',
      well_pump_type: '',
      well_pump_depth_ft: undefined,
      is_open: undefined,
      datalogger_possible: undefined,
      casing_diameter_ft: undefined,
      measuring_point_description: '',
      well_purpose: '',
      well_purpose_2: '',
      well_hole_status: '',
      monitoring_frequency: '',
      sampling_scenario_notes: '',
      well_measuring_notes: '',
      sample_possible: undefined,
    }
    setRows([...rows, newRow])
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
    
    // Check for duplicate well_name_point_id
    if (newRow.well_name_point_id) {
      const duplicate = updatedRows.find(
        (row) => row.id !== newRow.id && row.well_name_point_id === newRow.well_name_point_id
      )
      if (duplicate) {
        const errorMsg = `well_name_point_id: Duplicate value "${newRow.well_name_point_id}" found`
        errors.push(errorMsg)
        
        const key = `${newRow.id}-well_name_point_id`
        if (!fieldErrorMap.has(key)) {
          fieldErrorMap.set(key, new Set())
        }
        fieldErrorMap.get(key)!.add(`Duplicate value "${newRow.well_name_point_id}" found`)
      }
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
    setRows([])
    setUploadResult(null)
    setValidationErrors(new Map())
    const fileInput = document.getElementById('csv-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const convertRowsToCSV = (rows: TableRow[]): string => {
    const headers = [
      // Required
      'project',
      'well_name_point_id',
      'site_name',
      'date_time',
      'field_staff',
      'utm_easting',
      'utm_northing',
      'utm_zone',
      'elevation_ft',
      'elevation_method',
      'measuring_point_height_ft',
      // Optional
      'field_staff_2',
      'field_staff_3',
      'contact_1_name',
      'contact_1_organization',
      'contact_1_role',
      'contact_1_type',
      'contact_1_phone_1',
      'contact_1_phone_1_type',
      'contact_1_phone_2',
      'contact_1_phone_2_type',
      'contact_1_email_1',
      'contact_1_email_1_type',
      'contact_1_email_2',
      'contact_1_email_2_type',
      'contact_1_address_1_line_1',
      'contact_1_address_1_line_2',
      'contact_1_address_1_type',
      'contact_1_address_1_state',
      'contact_1_address_1_city',
      'contact_1_address_1_postal_code',
      'contact_1_address_2_line_1',
      'contact_1_address_2_line_2',
      'contact_1_address_2_type',
      'contact_1_address_2_state',
      'contact_1_address_2_city',
      'contact_1_address_2_postal_code',
      'contact_2_name',
      'contact_2_organization',
      'contact_2_role',
      'contact_2_type',
      'contact_2_phone_1',
      'contact_2_phone_1_type',
      'contact_2_phone_2',
      'contact_2_phone_2_type',
      'contact_2_email_1',
      'contact_2_email_1_type',
      'contact_2_email_2',
      'contact_2_email_2_type',
      'contact_2_address_1_line_1',
      'contact_2_address_1_line_2',
      'contact_2_address_1_type',
      'contact_2_address_1_state',
      'contact_2_address_1_city',
      'contact_2_address_1_postal_code',
      'contact_2_address_2_line_1',
      'contact_2_address_2_line_2',
      'contact_2_address_2_type',
      'contact_2_address_2_state',
      'contact_2_address_2_city',
      'contact_2_address_2_postal_code',
      'directions_to_site',
      'specific_location_of_well',
      'repeat_measurement_permission',
      'sampling_permission',
      'datalogger_installation_permission',
      'public_availability_acknowledgement',
      'result_communication_preference',
      'contact_special_requests_notes',
      'ose_well_record_id',
      'date_drilled',
      'completion_source',
      'total_well_depth_ft',
      'historic_depth_to_water_ft',
      'depth_source',
      'well_pump_type',
      'well_pump_depth_ft',
      'is_open',
      'datalogger_possible',
      'casing_diameter_ft',
      'measuring_point_description',
      'well_purpose',
      'well_purpose_2',
      'well_hole_status',
      'monitoring_frequency',
      'sampling_scenario_notes',
      'well_measuring_notes',
      'sample_possible',
    ]
    
    const csvRows = [
      headers.join(','),
      ...rows.map(row =>
        headers
          .map(header => {
            const value = row[header as keyof WellInventoryRow] ?? ''
            // Convert undefined/null to empty string, keep numbers as strings
            const stringValue = value === undefined || value === null ? '' : String(value)
            // Escape quotes and wrap in quotes if contains comma or quote
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(',')
      ),
    ]
    
    return csvRows.join('\n')
  }

  const columns: GridColDef<TableRow>[] = useMemo(() => {
    const getCellError = (rowId: number, fieldName: string): boolean => {
      return fieldErrors.has(`${rowId}-${fieldName}`)
    }
    
    return [
        {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        pinned: 'right',
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={() => handleDeleteRow(params.row.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        ),
      },
      // Required fields - most important
      {
        field: 'well_name_point_id',
        headerName: 'Well Name/Point ID',
        width: 180,
        editable: true,
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'well_name_point_id') ? 'error-cell' : ''
        },
      },
      {
        field: 'project',
        headerName: 'Project',
        width: 150,
        editable: true,
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'project') ? 'error-cell' : ''
        },
      },
      {
        field: 'site_name',
        headerName: 'Site Name',
        width: 150,
        editable: true,
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'site_name') ? 'error-cell' : ''
        },
      },
      {
        field: 'date_time',
        headerName: 'Date/Time',
        width: 200,
        editable: true,
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'date_time') ? 'error-cell' : ''
        },
      },
      {
        field: 'field_staff',
        headerName: 'Field Staff',
        width: 150,
        editable: true,
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'field_staff') ? 'error-cell' : ''
        },
      },
      {
        field: 'utm_easting',
        headerName: 'UTM Easting',
        width: 130,
        editable: true,
        type: 'number',
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'utm_easting') ? 'error-cell' : ''
        },
      },
      {
        field: 'utm_northing',
        headerName: 'UTM Northing',
        width: 130,
        editable: true,
        type: 'number',
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'utm_northing') ? 'error-cell' : ''
        },
      },
      {
        field: 'utm_zone',
        headerName: 'UTM Zone',
        width: 100,
        editable: true,
        type: 'number',
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'utm_zone') ? 'error-cell' : ''
        },
      },
      {
        field: 'elevation_ft',
        headerName: 'Elevation (ft)',
        width: 130,
        editable: true,
        type: 'number',
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'elevation_ft') ? 'error-cell' : ''
        },
      },
      {
        field: 'elevation_method',
        headerName: 'Elevation Method',
        width: 150,
        editable: true,
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'elevation_method') ? 'error-cell' : ''
        },
      },
      {
        field: 'measuring_point_height_ft',
        headerName: 'MP Height (ft)',
        width: 130,
        editable: true,
        type: 'number',
        required: true,
        cellClassName: (params) => {
          return getCellError(params.row.id, 'measuring_point_height_ft') ? 'error-cell' : ''
        },
      },
      // Key optional fields
      {
        field: 'total_well_depth_ft',
        headerName: 'Total Depth (ft)',
        width: 140,
        editable: true,
        type: 'number',
      },
      {
        field: 'well_purpose',
        headerName: 'Well Purpose',
        width: 150,
        editable: true,
      },
      {
        field: 'well_hole_status',
        headerName: 'Hole Status',
        width: 130,
        editable: true,
      },
      {
        field: 'monitoring_frequency',
        headerName: 'Monitoring Freq',
        width: 150,
        editable: true,
      },
      {
        field: 'contact_1_name',
        headerName: 'Contact 1 Name',
        width: 150,
        editable: true,
      },
      {
        field: 'contact_1_phone_1',
        headerName: 'Contact 1 Phone',
        width: 150,
        editable: true,
      },
      {
        field: 'contact_1_email_1',
        headerName: 'Contact 1 Email',
        width: 180,
        editable: true,
      },
    ]
  }, [fieldErrors])

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
      }}
    >
      <Stack spacing={3}>
        {!uploadResult && (
          <>
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Fill out the table below or import a CSV file to bulk import well inventory data.
              </Typography>
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
                  Import CSV
                </Button>
              </label>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddRow}
                disabled={isSubmitting}
              >
                Add Row
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
                    columnVisibilityModel={{
                      // Hide less commonly used fields by default, but they're still editable
                      field_staff_2: false,
                      field_staff_3: false,
                      contact_1_organization: false,
                      contact_1_role: false,
                      contact_1_type: false,
                      contact_1_phone_2: false,
                      contact_1_phone_2_type: false,
                      contact_1_email_2: false,
                      contact_1_email_2_type: false,
                      contact_1_address_1_line_2: false,
                      contact_1_address_1_type: false,
                      contact_1_address_1_state: false,
                      contact_1_address_1_city: false,
                      contact_1_address_1_postal_code: false,
                      contact_1_address_2_line_1: false,
                      contact_1_address_2_line_2: false,
                      contact_1_address_2_type: false,
                      contact_1_address_2_state: false,
                      contact_1_address_2_city: false,
                      contact_1_address_2_postal_code: false,
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

