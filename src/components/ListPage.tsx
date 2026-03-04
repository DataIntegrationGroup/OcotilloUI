import { Breadcrumb, ExportButton, List } from '@refinedev/mui'
import { DataGrid } from '@mui/x-data-grid'
import { settings } from '@/settings'
import React from 'react'
import { useExport } from '@refinedev/core'
import { Box, Typography } from '@mui/material'
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
        title={
          title ? (
            <Box>
              <Typography variant="h3" fontWeight={700}>
                {title}
              </Typography>
              {description && (
                <Typography
                  variant="body1"
                  sx={{ maxWidth: '85ch', mt: 0.5, color: 'text.secondary' }}
                >
                  {description}
                </Typography>
              )}
            </Box>
          ) : undefined
        }
        breadcrumb={<Breadcrumb hideIcons={true} />}
        wrapperProps={{
          elevation: 0,
          sx: { backgroundColor: 'background.wrapper', boxShadow: 'none', borderRadius: 1, padding: 0 },
        }}
        headerProps={{ sx: { '.MuiCardHeader-action': { alignSelf: 'flex-start', mt: 0.5, mr: 0 } } }}
        contentProps={{ sx: { pt: 1 } }}
      >
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
          // sx={{ backgroundColor: 'background.paper' }}
        />
      </List>
    </CanAccess>
  )
}
