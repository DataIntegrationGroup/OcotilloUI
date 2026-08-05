import { TableRowsOutlined, ViewAgendaOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { ReactNode, useMemo, useState } from 'react'
import { settings } from '@/settings'
import type {
  InfoItem,
  InfoSection,
  RawAttributeRow,
} from '@/utils/osePodSummary'
import { ExternalLink } from '../ExternalLink'
import { CardHeaderTitle } from './CardHeaderTitle'

type AttributeInfoCardProps = {
  icon: ReactNode
  title: string
  /** Curated, consolidated view of the record. */
  sections: InfoSection[]
  /** Every attribute the source returned, shown behind the raw-attributes toggle. */
  rawRows: RawAttributeRow[]
  emptyMessage: string
  errorMessage: string
  isLoading: boolean
  isError: boolean
}

const isHttpsUrl = (value: string): value is `https://${string}` =>
  value.startsWith('https://')

// Labels carry the source's own definition of the field, so they get a tooltip
// rather than burying the definition in a column the reader has to scroll to.
const ItemLabel = ({ item }: { item: InfoItem }) => {
  const label = (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={
        item.description
          ? { textDecoration: 'underline dotted', cursor: 'help' }
          : undefined
      }
    >
      {item.label}
    </Typography>
  )

  return item.description ? (
    <Tooltip title={item.description} placement="top-start">
      {label}
    </Tooltip>
  ) : (
    label
  )
}

const SummaryView = ({ sections }: { sections: InfoSection[] }) => (
  <Stack spacing={2.5}>
    {sections.map((section) => (
      <Box key={section.title}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 0.8 }}
        >
          {section.title}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'minmax(160px, 0.8fr) 1.2fr',
            },
            columnGap: 2,
            rowGap: 0.75,
            mt: 0.5,
          }}
        >
          {section.items.map((item) => [
            <ItemLabel key={`${item.label}-label`} item={item} />,
            <Typography
              key={`${item.label}-value`}
              variant="body2"
              sx={{ overflowWrap: 'anywhere' }}
            >
              {item.href && isHttpsUrl(item.href) ? (
                <ExternalLink href={item.href}>{item.value}</ExternalLink>
              ) : (
                item.value
              )}
            </Typography>,
          ])}
        </Box>
      </Box>
    ))}
  </Stack>
)

const RawView = ({ rows }: { rows: RawAttributeRow[] }) => {
  const columns = useMemo<GridColDef<RawAttributeRow>[]>(
    () => [
      { field: 'field', headerName: 'Attribute', minWidth: 130, flex: 0.6 },
      { field: 'label', headerName: 'Name', minWidth: 160, flex: 0.8 },
      {
        field: 'value',
        headerName: 'Value',
        minWidth: 180,
        flex: 1,
        renderCell: ({ value }) =>
          typeof value === 'string' && isHttpsUrl(value) ? (
            <ExternalLink href={value}>Open link</ExternalLink>
          ) : (
            value
          ),
      },
      {
        field: 'description',
        headerName: 'Description',
        minWidth: 240,
        flex: 1.4,
        renderCell: ({ value }) => (
          <Tooltip title={value ?? ''} placement="top-start">
            <span>{value}</span>
          </Tooltip>
        ),
      },
    ],
    []
  )

  return (
    <DataGrid<RawAttributeRow>
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      rowHeight={settings.rowHeight}
      disableRowSelectionOnClick
      pageSizeOptions={[10, 25, 50, 100]}
      initialState={{
        pagination: { paginationModel: { pageSize: 25, page: 0 } },
      }}
      sx={{
        border: 'none',
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #f0f0f0',
        },
      }}
    />
  )
}

/**
 * Card shell for the external-source records on the well details page (OSE POD,
 * USGS). Shows a consolidated summary by default and keeps the full attribute
 * table one click away.
 */
export const AttributeInfoCard = ({
  icon,
  title,
  sections,
  rawRows,
  emptyMessage,
  errorMessage,
  isLoading,
  isError,
}: AttributeInfoCardProps) => {
  const [showRaw, setShowRaw] = useState(false)

  const hasData = sections.length > 0 || rawRows.length > 0

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <CardHeaderTitle icon={icon} title={title} />
        {hasData && (
          <Button
            size="small"
            variant="text"
            startIcon={showRaw ? <ViewAgendaOutlined /> : <TableRowsOutlined />}
            onClick={() => setShowRaw((previous) => !previous)}
          >
            {showRaw ? 'Summary' : 'Raw attributes'}
          </Button>
        )}
      </Box>
      <Box sx={{ px: 2, py: 1, pb: 3 }}>
        {isLoading && (
          <Stack spacing={1}>
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} variant="text" height={28} />
            ))}
          </Stack>
        )}

        {!isLoading && isError && (
          <Typography
            variant="body1"
            textAlign="center"
            color="warning.main"
            padding={1}
          >
            {errorMessage}
          </Typography>
        )}

        {!isLoading && !isError && !hasData && (
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            padding={1}
          >
            {emptyMessage}
          </Typography>
        )}

        {!isLoading && !isError && hasData && (
          <>
            {showRaw ? (
              <RawView rows={rawRows} />
            ) : (
              <SummaryView sections={sections} />
            )}
          </>
        )}
      </Box>
    </Paper>
  )
}
