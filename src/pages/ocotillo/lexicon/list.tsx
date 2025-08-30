import { DataGrid } from '@mui/x-data-grid'
import { settings } from '@/settings'
import { CreateButton, ExportButton, List, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Card, Typography } from '@mui/material'
import { useExport } from '@refinedev/core'
import { actionColumnDef } from '@/components/CommonColumnDefs'

export const LexiconList: React.FC = () => {
  const headerButtons = ({ defaultButtons }) => {
    const { triggerExport: triggerTermExport, isLoading: exportTermIsLoading } =
      useExport({
        pageSize: 1000,
        resource: 'lexicon/term',
        dataProviderName: 'ocotillo',
      })
    const {
      triggerExport: triggerCategoryExport,
      isLoading: exportCategoryIsLoading,
    } = useExport({
      pageSize: 1000,
      resource: 'lexicon/category',
      dataProviderName: 'ocotillo',
    })

    return (
      <>
        <CreateButton>Term</CreateButton>
        <CreateButton resource={'ocotillo.lexicon/category'}>
          Category
        </CreateButton>

        <ExportButton
          variant={'contained'}
          loading={exportTermIsLoading}
          onClick={triggerTermExport}
        >
          Export Terms
        </ExportButton>
        <ExportButton
          variant={'contained'}
          loading={exportCategoryIsLoading}
          onClick={triggerCategoryExport}
        >
          Export Categories
        </ExportButton>
      </>
    )
  }
  const [selectedCategory, setSelectedCategory] = React.useState(null)

  const { dataGridProps: termDataGridProps } = useDataGrid({
    resource: 'lexicon/term',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        category: selectedCategory ? selectedCategory.name : undefined,
      },
    },
    queryOptions: {
      cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  })

  const termColumns = [
    { field: 'term', headerName: 'Term', width: 150 },
    { field: 'definition', headerName: 'Definition', width: 300 },
    {
      field: 'categories',
      headerName: 'Category',
      width: 150,
      valueGetter: (params) => {
        return params.map((c) => c.name).join(', ')
      },
      sortable: false,
      filterable: false,
    },
    actionColumnDef(),
  ]
  const { dataGridProps: categoryDataGridProps } = useDataGrid({
    resource: 'lexicon/category',
    dataProviderName: 'ocotillo',
    queryOptions: {
      cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  })
  const categoryColumns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    actionColumnDef({ resource: 'ocotillo.lexicon/category' }),
  ]

  return (
    <>
      <List headerButtons={headerButtons} title={'Lexicon'}>
        <Card sx={{ marginTop: 1, marginBottom: 1, padding: 1 }}>
          <Typography variant="body1">
            {'The Lexicon (aka Glossary) stores all the terms and definitions used in' +
              ' the data sytem'}
          </Typography>
        </Card>
        <Card>
          <Typography variant={'h3'}>Categories</Typography>
          <DataGrid
            pagination
            pageSizeOptions={[5, 10, 25]}
            paginationModel={{ pageSize: 10, page: 0 }}
            {...categoryDataGridProps}
            rowHeight={settings.rowHeight}
            columns={categoryColumns}
            onRowClick={(params) => setSelectedCategory(params.row)}
            getRowClassName={(params) =>
              params.id === selectedCategory?.id ? 'selected-row' : ''
            }
            sx={{
              '& .selected-row': {
                backgroundColor: (theme) => theme.palette.secondary.light,
              },
            }}
          />
        </Card>
        <Card>
          <Typography variant={'h3'}>Terms</Typography>
          <DataGrid
            pagination
            pageSizeOptions={[5, 10, 25]}
            paginationModel={{ pageSize: 10, page: 0 }}
            {...termDataGridProps}
            disableRowSelectionOnClick={false}
            rowHeight={settings.rowHeight}
            columns={termColumns}

            // onRowSelectionModelChange={handleSelectionChangeWrapper}
            // loading={isLoading}
          />
        </Card>
      </List>
    </>
  )
}
