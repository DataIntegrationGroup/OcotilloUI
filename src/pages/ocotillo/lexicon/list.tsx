import { DataGrid } from '@mui/x-data-grid'
import { settings } from '@/settings'
import { ExportButton, List, useDataGrid } from '@refinedev/mui'
import React from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useExport } from '@refinedev/core'

export const LexiconList: React.FC = () => {
  const headerButtons = () => {
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
        <ExportButton
          variant="contained"
          loading={exportTermIsLoading}
          onClick={triggerTermExport}
        >
          Export Terms
        </ExportButton>
        <ExportButton
          variant="contained"
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
      valueGetter: (params: any) => {
        return params.map((c: { name: string }) => c.name).join(', ')
      },
      sortable: false,
      filterable: false,
    },
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
  ]

  return (
    <List headerButtons={headerButtons} title={'Lexicon'}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card
            className="description"
            variant="outlined"
            sx={{
              marginTop: 1,
              marginBottom: 1,
              padding: 1,
            }}
          >
            <Typography variant="body1">
              The Lexicon (aka Glossary) stores all the terms and definitions
              used in the data sytem
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card elevation={2}>
            <CardHeader title="Categories" />
            <CardContent>
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
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card elevation={2}>
            <CardHeader title="Terms" />
            <CardContent>
              <DataGrid
                pagination
                pageSizeOptions={[5, 10, 25]}
                paginationModel={{ pageSize: 10, page: 0 }}
                {...termDataGridProps}
                disableRowSelectionOnClick={false}
                rowHeight={settings.rowHeight}
                columns={termColumns}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </List>
  )
}
