import type { Column } from '@tanstack/react-table'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  FilterIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  COMPARISON_OPERATOR_LABELS,
  type DataTableComparisonOperator,
  isComparisonValue,
} from '@/components/DataTable/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Header cell content for a DataTable column: the label, a tri-state sort
 * toggle (ascending, descending, unsorted) and — when the column declares a
 * `filter` in its meta — a filter popover. Filtering and sorting state live in
 * the table instance, so this component works the same whether the page runs
 * client side or hands the state to the server.
 */

const FILTER_DEBOUNCE_MS = 400

function TextFilter<TData, TValue>({
  column,
  label,
  placeholder,
}: {
  column: Column<TData, TValue>
  label: string
  placeholder?: string
}) {
  const committed = (column.getFilterValue() as string | undefined) ?? ''
  const [draft, setDraft] = useState(committed)

  // Re-sync when the filter is cleared from a chip or by another control.
  useEffect(() => {
    setDraft(committed)
  }, [committed])

  useEffect(() => {
    if (draft === committed) return

    const timer = setTimeout(() => {
      const next = draft.trim()
      column.setFilterValue(next === '' ? undefined : next)
    }, FILTER_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [column, committed, draft])

  return (
    <div className="flex flex-col gap-2">
      <Input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder ?? `Filter by ${label.toLowerCase()}…`}
        aria-label={`Filter by ${label}`}
        className="h-8 text-sm"
      />
      <Button
        variant="ghost"
        size="sm"
        className="self-end"
        disabled={committed === '' && draft === ''}
        onClick={() => {
          setDraft('')
          column.setFilterValue(undefined)
        }}
      >
        Clear
      </Button>
    </div>
  )
}

function SelectFilter<TData, TValue>({
  column,
  label,
  options,
}: {
  column: Column<TData, TValue>
  label: string
  options: { label: string; value: string }[]
}) {
  const selected = column.getFilterValue() as string | undefined

  return (
    <div className="flex max-h-72 flex-col overflow-y-auto">
      <button
        type="button"
        onClick={() => column.setFilterValue(undefined)}
        className={cn(
          'flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
          selected === undefined && 'font-medium'
        )}
      >
        <CheckIcon
          className={cn('size-3.5', selected !== undefined && 'invisible')}
          aria-hidden
        />
        {label}: any
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() =>
            column.setFilterValue(
              selected === option.value ? undefined : option.value
            )
          }
          className={cn(
            'flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
            selected === option.value && 'font-medium'
          )}
        >
          <CheckIcon
            className={cn('size-3.5', selected !== option.value && 'invisible')}
            aria-hidden
          />
          {option.label}
        </button>
      ))}
    </div>
  )
}

function ComparisonFilter<TData, TValue>({
  column,
  label,
  inputType,
  defaultOperator = 'eq',
}: {
  column: Column<TData, TValue>
  label: string
  inputType: 'number' | 'date'
  defaultOperator?: DataTableComparisonOperator
}) {
  const committed = column.getFilterValue()
  const current = isComparisonValue(committed) ? committed : undefined
  const [operator, setOperator] = useState<DataTableComparisonOperator>(
    current?.operator ?? defaultOperator
  )
  const [draft, setDraft] = useState(current?.value ?? '')

  const commit = (nextOperator: DataTableComparisonOperator, next: string) => {
    const trimmed = next.trim()
    column.setFilterValue(
      trimmed === '' ? undefined : { operator: nextOperator, value: trimmed }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Select
          value={operator}
          onValueChange={(value) => {
            const next = value as DataTableComparisonOperator
            setOperator(next)
            if (draft.trim() !== '') commit(next, draft)
          }}
        >
          <SelectTrigger
            className="h-8 w-16 text-sm"
            aria-label={`${label} comparison`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {(
              Object.keys(
                COMPARISON_OPERATOR_LABELS
              ) as DataTableComparisonOperator[]
            ).map((option) => (
              <SelectItem key={option} value={option}>
                {COMPARISON_OPERATOR_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type={inputType}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(operator, draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit(operator, draft)
          }}
          aria-label={`Filter by ${label}`}
          className="h-8 flex-1 text-sm"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="self-end"
        disabled={current === undefined && draft === ''}
        onClick={() => {
          setDraft('')
          column.setFilterValue(undefined)
        }}
      >
        Clear
      </Button>
    </div>
  )
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>
  title: string
}) {
  const filter = column.columnDef.meta?.filter
  const description = column.columnDef.meta?.description
  const canFilter = Boolean(filter) && column.getCanFilter()
  const canSort = column.getCanSort()
  const sorted = column.getIsSorted()
  const hasFilter = column.getFilterValue() !== undefined

  const SortIcon = !sorted
    ? ChevronsUpDownIcon
    : sorted === 'asc'
      ? ArrowUpIcon
      : ArrowDownIcon

  return (
    <div className="flex items-center gap-0.5">
      {canSort ? (
        <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          title={description}
          className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {title}
          <SortIcon
            className={cn(
              'size-3.5',
              sorted ? 'text-foreground' : 'text-muted-foreground/60'
            )}
            aria-hidden
          />
        </button>
      ) : (
        <span title={description}>{title}</span>
      )}

      {canFilter && filter ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Filter ${title}`}
              className={cn(
                'text-muted-foreground/60 hover:text-foreground',
                hasFilter && 'text-primary'
              )}
            >
              <FilterIcon aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-60 p-2">
            {filter.type === 'text' ? (
              <TextFilter
                column={column}
                label={title}
                placeholder={filter.placeholder}
              />
            ) : filter.type === 'select' ? (
              <SelectFilter
                column={column}
                label={title}
                options={filter.options}
              />
            ) : (
              <ComparisonFilter
                column={column}
                label={title}
                inputType={filter.type}
                defaultOperator={filter.defaultOperator}
              />
            )}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}
