import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  PencilIcon,
  SearchIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'
import { cn } from '@/lib/utils'
import { formatAppDateTime } from '@/utils'

/**
 * Projects table. Sorting, filtering and paging all run over the full result
 * set held in memory — the group endpoint returns well under a thousand rows
 * and ignores sort parameters, so filtering a single server page would only
 * ever describe part of the data.
 */

export type ProjectSortKey =
  | 'name'
  | 'description'
  | 'release_status'
  | 'group_type'
  | 'created_at'

type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 20

const NO_VALUE = '—'
const ALL_OPTION = '__all__'
const EMPTY_OPTION = '__empty__'

const RELEASE_STATUS_VARIANT: Record<
  string,
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'filter'
  | 'filterEmerald'
> = {
  draft: 'secondary',
  provisional: 'filter',
  final: 'filterEmerald',
  published: 'filterEmerald',
  public: 'filterEmerald',
  archived: 'outline',
  private: 'destructive',
}

const COLUMNS: { key: ProjectSortKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description', className: 'w-[30%]' },
  { key: 'release_status', label: 'Release Status', className: 'w-40' },
  { key: 'group_type', label: 'Type', className: 'w-44' },
  { key: 'created_at', label: 'Created At', className: 'w-48' },
]

function valueFor(project: IGroup, key: ProjectSortKey): string {
  const value = project[key]
  return typeof value === 'string' ? value : ''
}

/** Case-insensitive compare that always sorts blanks to the bottom. */
function compareProjects(
  a: IGroup,
  b: IGroup,
  key: ProjectSortKey,
  direction: SortDirection
): number {
  const left = valueFor(a, key)
  const right = valueFor(b, key)

  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1

  const result =
    key === 'created_at'
      ? new Date(left).getTime() - new Date(right).getTime()
      : left.localeCompare(right, undefined, { sensitivity: 'base' })

  return direction === 'asc' ? result : -result
}

/** A facet select matches everything, only blanks, or one exact value. */
function matchesFacet(value: string, filter: string): boolean {
  if (filter === ALL_OPTION) return true
  if (filter === EMPTY_OPTION) return value === ''
  return value === filter
}

function distinctValues(projects: IGroup[], key: ProjectSortKey): string[] {
  const values = new Set<string>()
  for (const project of projects) {
    const value = valueFor(project, key)
    if (value) values.add(value)
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

function FilterSelect({
  label,
  value,
  options,
  hasBlanks,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  hasBlanks: boolean
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-44 text-sm" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-60">
        <SelectItem value={ALL_OPTION}>{label}: all</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
        {hasBlanks ? (
          <SelectItem value={EMPTY_OPTION}>{label}: none</SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}

function SortableHeader({
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  column: (typeof COLUMNS)[number]
  sortKey: ProjectSortKey
  sortDirection: SortDirection
  onSort: (key: ProjectSortKey) => void
}) {
  const isSorted = sortKey === column.key
  const SortIcon = !isSorted
    ? ChevronsUpDownIcon
    : sortDirection === 'asc'
      ? ArrowUpIcon
      : ArrowDownIcon

  return (
    <TableHead
      className={column.className}
      aria-sort={
        isSorted
          ? sortDirection === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {column.label}
        <SortIcon
          className={cn(
            'size-3.5',
            isSorted ? 'text-foreground' : 'text-muted-foreground/60'
          )}
          aria-hidden
        />
      </button>
    </TableHead>
  )
}

export interface ProjectsTableProps {
  projects: IGroup[]
  isLoading?: boolean
  canEdit?: boolean
  selectedProjectId?: number | null
  projectHref: (project: IGroup) => string
  onSelect?: (project: IGroup) => void
  onEdit?: (project: IGroup, source: 'row_double_click' | 'edit_action') => void
}

export function ProjectsTable({
  projects,
  isLoading = false,
  canEdit = false,
  selectedProjectId = null,
  projectHref,
  onSelect,
  onEdit,
}: ProjectsTableProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(ALL_OPTION)
  const [statusFilter, setStatusFilter] = useState(ALL_OPTION)
  const [sortKey, setSortKey] = useState<ProjectSortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [page, setPage] = useState(0)

  const typeOptions = useMemo(
    () => distinctValues(projects, 'group_type'),
    [projects]
  )
  const statusOptions = useMemo(
    () => distinctValues(projects, 'release_status'),
    [projects]
  )
  const hasUntyped = useMemo(
    () => projects.some((project) => !valueFor(project, 'group_type')),
    [projects]
  )
  const hasNoStatus = useMemo(
    () => projects.some((project) => !valueFor(project, 'release_status')),
    [projects]
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()

    return projects.filter((project) => {
      const type = valueFor(project, 'group_type')
      const status = valueFor(project, 'release_status')

      if (!matchesFacet(type, typeFilter)) return false
      if (!matchesFacet(status, statusFilter)) return false

      if (!needle) return true

      return [project.name, project.description, type, status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    })
  }, [projects, search, statusFilter, typeFilter])

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        compareProjects(a, b, sortKey, sortDirection)
      ),
    [filtered, sortDirection, sortKey]
  )

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))

  // Filtering can shrink the result set out from under the current page.
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  const pageRows = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const handleSort = (key: ProjectSortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  const rangeStart = sorted.length === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd = Math.min(sorted.length, (page + 1) * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="h-8 w-72 pl-8 text-sm"
          />
        </div>

        <FilterSelect
          label="Type"
          value={typeFilter}
          options={typeOptions}
          hasBlanks={hasUntyped}
          onChange={(value) => {
            setTypeFilter(value)
            setPage(0)
          }}
        />

        <FilterSelect
          label="Release status"
          value={statusFilter}
          options={statusOptions}
          hasBlanks={hasNoStatus}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(0)
          }}
        />

        <span className="ml-auto text-xs text-muted-foreground">
          {sorted.length === projects.length
            ? `${projects.length.toLocaleString()} projects`
            : `${sorted.length.toLocaleString()} of ${projects.length.toLocaleString()} projects`}
        </span>
      </div>

      <div className="rounded-md border">
        {/* Compact rows: shorter header, tighter cell padding than the shadcn default. */}
        <Table className="[&_td]:py-1 [&_th]:h-8">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <SortableHeader
                  key={column.key}
                  column={column}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              ))}
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {COLUMNS.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No projects match these filters.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((project) => {
                const status = valueFor(project, 'release_status')
                const type = valueFor(project, 'group_type')

                return (
                  <TableRow
                    key={project.id}
                    data-state={
                      selectedProjectId === project.id ? 'selected' : undefined
                    }
                    onClick={() => onSelect?.(project)}
                    onDoubleClick={() => onEdit?.(project, 'row_double_click')}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      <RouterLink
                        to={projectHref(project)}
                        onClick={(event) => event.stopPropagation()}
                        className="hover:underline"
                      >
                        {project.name}
                      </RouterLink>
                    </TableCell>
                    <TableCell className="max-w-0 truncate text-muted-foreground">
                      {project.description?.trim() || NO_VALUE}
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <Badge
                          variant={
                            RELEASE_STATUS_VARIANT[status] ?? 'secondary'
                          }
                        >
                          {status}
                        </Badge>
                      ) : (
                        NO_VALUE
                      )}
                    </TableCell>
                    <TableCell>{type || NO_VALUE}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAppDateTime(project.created_at)}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Edit ${project.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onEdit?.(project, 'edit_action')
                          }}
                        >
                          <PencilIcon className="size-3.5" aria-hidden />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {sorted.length === 0
            ? 'No results'
            : `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${sorted.length.toLocaleString()}`}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            <ChevronLeftIcon className="size-3.5" aria-hidden />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount - 1}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
          >
            Next
            <ChevronRightIcon className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}
