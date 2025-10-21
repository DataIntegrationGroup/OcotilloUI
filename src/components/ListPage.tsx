import { Breadcrumb, ExportButton, List } from '@refinedev/mui'
import { DataGrid } from '@mui/x-data-grid'
import { settings } from '@/settings'
import React from 'react'
import { useExport } from '@refinedev/core'
import { Card, Typography } from '@mui/material'
import { CanAccess } from '@refinedev/core'

type ListPageProps = {
  title?: string | null
  description?: string | null
  columns: any
  dataGridProps: any
  exportProps?: any
  children?: any
  onSelectionChange?: (selectionModel: any) => void
  getRowId?: (row: any) => number
  isLoading?: any
  headerButtons?: any
}

export const ListPage: React.FC<ListPageProps> = ({
  title,
  description,
  columns,
  dataGridProps,
  getRowId,
  exportProps,
  children,
  onSelectionChange,
  isLoading,
  headerButtons,
}) => {
  if (!exportProps) {
    exportProps = { pageSize: 1000 }
  }

  const handleSelectionChangeWrapper = (selectionModel: any) => {
    if (onSelectionChange) {
      onSelectionChange(selectionModel)
    }
  }

  const { triggerExport, isLoading: exportIsLoading } = useExport(exportProps)
  const defaultHeaderButtons = ({ defaultButtons }) => {
    return (
      <>
        <CanAccess>{defaultButtons}</CanAccess>
        <ExportButton
          variant={'contained'}
          loading={exportIsLoading}
          onClick={triggerExport}
        />
      </>
    )
  }

  return (
    <CanAccess>
      <List
        headerButtons={headerButtons || defaultHeaderButtons}
        title={title}
        breadcrumb={<Breadcrumb hideIcons={true} />}
      >
        {description && (
          <Card
            className={'description'}
            variant="outlined"
            sx={{
              marginTop: 1,
              marginBottom: 1,
              padding: 1,
            }}
          >
            <Typography variant="body1">{description}</Typography>
          </Card>
        )}

        {children}
        <DataGrid
          {...dataGridProps}
          disableRowSelectionOnClick={false}
          rowHeight={settings.rowHeight}
          getRowId={getRowId ? getRowId : (row) => row.PointID}
          onRowSelectionModelChange={handleSelectionChangeWrapper}
          loading={isLoading}
          columns={columns}
          columnPinningModel={{ right: ['actions'] }}
        />
      </List>
    </CanAccess>
  )
}
