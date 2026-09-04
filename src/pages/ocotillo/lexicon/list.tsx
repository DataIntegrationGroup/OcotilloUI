import { useExport, useTable } from '@refinedev/core'
import { ExportButton } from '@refinedev/mui'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { captureEvent } from '@/analytics/posthog'
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  useRefineDataTable,
} from '@/components/DataTable'
import { ListPageShell } from '@/components/ListPageShell'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ICategory, ITerm } from '@/interfaces/ocotillo/ILexicon'

/**
 * Lexicon / Glossary. Two server-paginated tables side by side: selecting a
 * category filters the terms table to that category. The terms table stays
 * hidden until a category is picked, so its query never runs unfiltered.
 */

const LEXICON_PAGE_SIZE = 25

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

export const LexiconList = () => {
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  )

  // --- Categories -----------------------------------------------------------
  const categoryTable = useTable<ICategory>({
    resource: 'lexicon/category',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: LEXICON_PAGE_SIZE },
    queryOptions: {
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  })

  const categoryColumns = useMemo<ColumnDef<ICategory, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (category) => category.name,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        meta: { label: 'Name', cellClassName: 'font-medium' },
      },
      {
        id: 'description',
        accessorFn: (category) => category.description ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        meta: { label: 'Description' },
      },
    ],
    []
  )

  const categoryTableOptions = useRefineDataTable<ICategory>({
    refineTable: categoryTable,
    columns: categoryColumns,
    analyticsPrefix: 'lexicon_categories',
  })

  const categoryReactTable = useReactTable({
    data: categoryTable.result.data,
    columns: categoryColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (category) => String(category.id),
    ...categoryTableOptions,
  })

  // --- Terms ----------------------------------------------------------------
  // The query is disabled until a category is picked; the table is not
  // rendered before then either, so it never shows an unfiltered page.
  const termTable = useTable<ITerm>({
    resource: 'lexicon/term',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: LEXICON_PAGE_SIZE },
    meta: {
      params: { category: selectedCategory?.name },
    },
    queryOptions: {
      enabled: !!selectedCategory,
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

  const termColumns = useMemo<ColumnDef<ITerm, unknown>[]>(
    () => [
      {
        id: 'term',
        accessorFn: (term) => term.term,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Term" />
        ),
        meta: { label: 'Term', cellClassName: 'font-medium' },
      },
      {
        id: 'definition',
        accessorFn: (term) => term.definition,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Definition" />
        ),
        meta: { label: 'Definition' },
      },
    ],
    []
  )

  const termTableOptions = useRefineDataTable<ITerm>({
    refineTable: termTable,
    columns: termColumns,
    analyticsPrefix: 'lexicon_terms',
  })

  const termReactTable = useReactTable({
    data: termTable.result.data,
    columns: termColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (term) => String(term.id),
    ...termTableOptions,
  })

  return (
    <ListPageShell
      title="Lexicon / Glossary"
      description="The Lexicon (aka Glossary) stores all the terms and definitions used in the data system."
      accessResource="ocotillo.lexicon"
      headerButtons={<LexiconHeaderButtons />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DataTable
              table={categoryReactTable}
              isLoading={categoryTable.tableQuery.isLoading}
              emptyMessage="No categories found."
              isRowSelected={(category) => category.id === selectedCategory?.id}
              onRowClick={(category) => {
                setSelectedCategory((previous) =>
                  previous?.id === category.id ? null : category
                )
                captureEvent('lexicon_category_clicked', {
                  category_id: category.id,
                })
              }}
            />
            <DataTablePagination table={categoryReactTable} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms</CardTitle>
            {selectedCategory?.description ? (
              <CardDescription>{selectedCategory.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selectedCategory ? (
              <>
                <DataTable
                  table={termReactTable}
                  isLoading={termTable.tableQuery.isLoading}
                  emptyMessage="No terms in this category."
                />
                <DataTablePagination table={termReactTable} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please select a category
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ListPageShell>
  )
}
