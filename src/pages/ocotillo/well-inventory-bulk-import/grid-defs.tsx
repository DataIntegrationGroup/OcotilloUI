import { GridColDef } from '@mui/x-data-grid'
import { IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { allFieldNames, requiredFields, numericFields, booleanFields } from './utils'
import type { TableRow } from './index'

export function createGridColumns(
  getCellError: (rowId: number, fieldName: string) => boolean,
  handleDeleteRow: (id: number) => void
): GridColDef<TableRow>[] {
  // Create columns for all fields from schema
  const dataColumns: GridColDef<TableRow>[] = allFieldNames.map((fieldName) => {
    const isRequired = requiredFields.includes(fieldName)
    const isNumeric = numericFields.includes(fieldName)
    const isBoolean = booleanFields.includes(fieldName)

    const baseColumn: GridColDef<TableRow> = {
      field: fieldName,
      headerName: fieldName,
      width: 150,
      editable: true,
      cellClassName: (params) => {
        return getCellError(params.row.id, fieldName) ? 'error-cell' : ''
      },
    }

    if (isNumeric) {
      baseColumn.type = 'number'
      baseColumn.width = 130
    } else if (isBoolean) {
      baseColumn.type = 'boolean'
      baseColumn.width = 120
    }

    return baseColumn
  })

  // Add actions column at the beginning
  const actionsColumn: GridColDef<TableRow> = {
    field: 'actions',
    headerName: 'Actions',
    width: 100,
    sortable: false,
    renderCell: (params) => (
      <IconButton
        size="small"
        onClick={() => handleDeleteRow(params.row.id)}
        color="error"
      >
        <DeleteIcon />
      </IconButton>
    ),
  }

  return [actionsColumn, ...dataColumns]
}

