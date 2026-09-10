import { useState, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { ExportButton, List, useDataGrid } from '@refinedev/mui'
import { alpha } from '@mui/material/styles'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useExport } from '@refinedev/core'
import { settings } from '@/settings'

const LexiconHeaderButtons = () => {
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
        loading={exportCategoryIsLoading}
        onClick={triggerCategoryExport}
      >
        Export Categories
      </ExportButton>
      <ExportButton
        variant="contained"
        loading={exportTermIsLoading}
        onClick={triggerTermExport}
      >
        Export Terms
      </ExportButton>
    </>
  )
}

interface LexiconCategory {
  id: number | string
  name: string
  description?: string | null
}

export const LexiconList = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<LexiconCategory | null>(null)
  const handleRowClick = useCallback((params?: any) => {
    setSelectedCategory((prev?: any) =>
      prev?.id === params.row.id ? null : params.row
    )
  }, [])

  const getRowClassName = useCallback(
    (params?: any) =>
      params.id === selectedCategory?.id ? 'selected-row' : '',
    [selectedCategory]
  )

  const { dataGridProps: termDataGridProps } = useDataGrid({
    resource: 'lexicon/term',
    dataProviderName: 'ocotillo',
    meta: {
      params: {
        category: selectedCategory ? selectedCategory.name : undefined,
      },
    },
    queryOptions: {
      enabled: !!selectedCategory,
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes
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
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  })
  const categoryColumns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
  ]

  return (
    <List headerButtons={<LexiconHeaderButtons />} title="Lexicon / Glossary">
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
                onRowClick={handleRowClick}
                getRowClassName={getRowClassName}
                sx={{
                  '& .selected-row': {
                    bgcolor: (theme) => theme.palette.secondary.light,
                    '&:hover': {
                      bgcolor: (theme) =>
                        alpha(theme.palette.secondary.light, 0.75),
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card elevation={2}>
            <CardHeader
              title="Terms"
              subheader={selectedCategory?.description ?? undefined}
            />
            <CardContent>
              {selectedCategory ? (
                <DataGrid
                  pagination
                  pageSizeOptions={[5, 10, 25]}
                  paginationModel={{ pageSize: 10, page: 0 }}
                  {...termDataGridProps}
                  rowHeight={settings.rowHeight}
                  columns={termColumns}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Please select a category
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </List>
  )
}
