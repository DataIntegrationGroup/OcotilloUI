import { DataGrid } from '@mui/x-data-grid'
import { settings } from '@/settings'
import { ExportButton, List, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Card, Typography } from '@mui/material'
import { useExport } from '@refinedev/core'

export const LexiconList: React.FC = () => {
  const headerButtons = ({ defaultButtons }) => {
    const {
      triggerExport: triggerLexiconExport,
      isLoading: exportLexiconIsLoading,
    } = useExport({
      pageSize: 1000,
      resource: 'lexicon',
      dataProviderName: 'dataforge',
    })
    const {
      triggerExport: triggerCategoryExport,
      isLoading: exportCategoryIsLoading,
    } = useExport({
      pageSize: 1000,
      resource: 'lexicon/category',
      dataProviderName: 'dataforge',
    })

    return (
      <>
        {defaultButtons}
        <ExportButton
          variant={'contained'}
          loading={exportLexiconIsLoading}
          onClick={triggerLexiconExport}
        >
          Export Lexicon
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
  const handleCategoryRowClick = (params) => {
    // Handle the row click event for categories
    setSelectedCategory(params.row)
  }

  const { dataGridProps: termDataGridProps } = useDataGrid({
    resource: 'lexicon',
    dataProviderName: 'dataforge',
    meta: {
      params: {
        category: selectedCategory ? selectedCategory.name : undefined,
      },
    },
    // queryOptions: {
    //   cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
    //   staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    // },
    pagination: {
      pageSize: 25,
    },
    // onRowSelectionModelChange: handleSelectionChangeWrapper,
  })
  const termColumns = [
    {
      field: 'categories',
      headerName: 'Category',
      width: 150,
      valueGetter: (params) => {
        return params.map((c) => c.category.name).join(', ')
      },
      sortable: false,
      filterable: false,
    },
    { field: 'term', headerName: 'Term', width: 150 },
    { field: 'definition', headerName: 'Definition', width: 300 },
    // { field: 'Name', headerName: 'Name', width: 200 },
    // { field: 'Type', headerName: 'Type', width: 150 },
    // { field: 'Description', headerName: 'Description', width: 300 },
    // Add more columns as needed
  ]
  const { dataGridProps: categoryDataGridProps } = useDataGrid({
    resource: 'lexicon/category',
    dataProviderName: 'dataforge',
    // queryOptions: {
    //   cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
    //   staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    // },
    pagination: { pageSize: 10 },
    // onRowSelectionModelChange: handleSelectionChangeWrapper,
  })
  const categoryColumns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    // Add more columns as needed
  ]

  return (
    <>
      <List headerButtons={headerButtons} title={'Lexicon'}>
        <Card>
          <Typography variant={'h3'}>Categories</Typography>
          <DataGrid
            {...categoryDataGridProps}
            rowHeight={settings.rowHeight}
            columns={categoryColumns}
            onRowClick={(params) => setSelectedCategory(params.row)}
          />
        </Card>
        <Card>
          <Typography variant={'h3'}>Terms</Typography>
          <DataGrid
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
