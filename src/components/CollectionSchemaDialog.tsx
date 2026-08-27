import { Close, ContentCopy, DataObject } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { SCREENS } from '@/constants/breakpoints'
import { useCollectionSchema } from '@/hooks'
import { settings } from '@/settings'
import {
  buildSchemaFieldRows,
  collectionSchemaUrl,
  roleLabelOf,
  type SchemaFieldRow,
} from '@/utils/collectionSchema'

type SchemaView = 'fields' | 'raw'

export type CollectionSchemaDialogProps = {
  open: boolean
  onClose: () => void
  collectionId?: string
  /** Catalogue title, used until the schema document supplies its own. */
  title: string
}

/**
 * Shows a collection's published JSON Schema as a readable field table, with
 * the raw document one toggle away.
 *
 * The table is the default view on purpose: the schema is read far more often
 * to answer "what columns does this dataset have and what do they mean" than
 * to be copied verbatim, and the server fills in per-property titles and
 * descriptions that a raw JSON dump buries.
 */
export const CollectionSchemaDialog = ({
  open,
  onClose,
  collectionId,
  title,
}: CollectionSchemaDialogProps) => {
  const [view, setView] = useState<SchemaView>('fields')
  const [copied, setCopied] = useState(false)
  const {
    data: schema,
    isLoading,
    isError,
    error,
  } = useCollectionSchema(collectionId, { enabled: open })

  const rows = schema ? buildSchemaFieldRows(schema) : []
  const schemaUrl = collectionId
    ? collectionSchemaUrl(settings.ocotillo_api_url, collectionId)
    : undefined
  const rawJson = schema ? JSON.stringify(schema, null, 2) : ''

  const handleCopy = async () => {
    if (!rawJson) return
    await navigator.clipboard.writeText(rawJson)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      aria-labelledby="collection-schema-dialog-title"
      // Field descriptions and enum chips are what make this readable, and at
      // a fixed `md` they wrap to three lines apiece. On a desktop screen the
      // dialog takes most of the viewport instead, capped so the rows do not
      // run the full span of a very wide display.
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            [`@media (min-width:${SCREENS.desktop})`]: {
              width: '92%',
              maxWidth: 1180,
            },
            [`@media (min-width:${SCREENS.widescreen})`]: {
              maxWidth: 1360,
            },
          },
        },
      }}
    >
      <DialogTitle id="collection-schema-dialog-title" sx={{ pr: 6, pb: 1.5 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <DataObject fontSize="small" color="action" />
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
              {schema?.title || title}
            </Typography>
            {collectionId ? (
              <Typography
                component="code"
                variant="caption"
                color="text.secondary"
                sx={{ overflowWrap: 'anywhere' }}
              >
                {collectionId}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
        <IconButton
          onClick={onClose}
          aria-label="Close schema"
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {isLoading ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Loading schema...
            </Typography>
          </Stack>
        ) : isError ? (
          <Alert severity="error">
            Failed to load the schema for this dataset.
            {error instanceof Error ? ` ${error.message}` : null}
          </Alert>
        ) : (
          <Stack spacing={2}>
            {schema?.description ? (
              <Typography variant="body2" color="text.secondary">
                {schema.description}
              </Typography>
            ) : null}

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={view}
                onChange={(_event, next: SchemaView | null) => {
                  if (next) setView(next)
                }}
                aria-label="Schema layout"
              >
                <ToggleButton value="fields" aria-label="Field view">
                  Fields
                </ToggleButton>
                <ToggleButton value="raw" aria-label="Raw JSON view">
                  Raw JSON
                </ToggleButton>
              </ToggleButtonGroup>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${rows.length} field${rows.length === 1 ? '' : 's'}`}
                />
                <Button
                  size="small"
                  startIcon={<ContentCopy fontSize="small" />}
                  onClick={handleCopy}
                  disabled={!rawJson}
                >
                  {copied ? 'Copied' : 'Copy JSON'}
                </Button>
              </Stack>
            </Stack>

            {view === 'fields' ? (
              <SchemaFieldTable rows={rows} />
            ) : (
              <Box
                component="pre"
                sx={(theme) => ({
                  m: 0,
                  p: 2,
                  borderRadius: 2,
                  maxHeight: '60vh',
                  overflow: 'auto',
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                })}
              >
                {rawJson}
              </Box>
            )}

            {schemaUrl ? (
              <Typography variant="caption" color="text.secondary">
                Source:{' '}
                <Link
                  href={schemaUrl}
                  target="_blank"
                  rel="noreferrer"
                  underline="hover"
                  sx={{ overflowWrap: 'anywhere' }}
                >
                  {schemaUrl}
                </Link>
              </Typography>
            ) : null}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}

const SchemaFieldTable = ({ rows }: { rows: SchemaFieldRow[] }) => {
  const theme = useTheme()
  // Three columns cannot fit a phone: the description column is what carries
  // the meaning, and in a table it either wraps to a sliver or pushes the row
  // off-screen. Below the tablet breakpoint each field becomes its own block.
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))

  if (rows.length === 0) {
    return (
      <Alert severity="info">
        This dataset does not publish any schema properties.
      </Alert>
    )
  }

  if (isNarrow) {
    return <SchemaFieldList rows={rows} />
  }

  return (
    <TableContainer sx={{ maxHeight: '60vh' }}>
      <Table size="small" stickyHeader aria-label="Schema fields">
        <TableHead>
          <TableRow>
            <TableCell>Field</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const roleLabel = roleLabelOf(row.role)

            return (
              <TableRow key={row.name} hover>
                <TableCell sx={{ minWidth: 170, verticalAlign: 'top' }}>
                  <Stack spacing={0.5}>
                    <Typography
                      component="code"
                      variant="body2"
                      sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}
                    >
                      {row.name}
                    </Typography>
                    {row.title && row.title !== row.name ? (
                      <Typography variant="caption" color="text.secondary">
                        {row.title}
                      </Typography>
                    ) : null}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {roleLabel ? (
                        <Chip
                          size="small"
                          label={roleLabel}
                          variant="outlined"
                        />
                      ) : null}
                      {row.required ? (
                        <Chip size="small" label="required" color="primary" />
                      ) : null}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell sx={{ minWidth: 120, verticalAlign: 'top' }}>
                  <Typography
                    component="code"
                    variant="caption"
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    {row.typeLabel}
                  </Typography>
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Stack spacing={0.75}>
                    {row.description ? (
                      <Typography variant="body2" color="text.secondary">
                        {row.description}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                    {row.enumValues?.length ? (
                      <EnumValues values={row.enumValues} />
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const SchemaFieldList = ({ rows }: { rows: SchemaFieldRow[] }) => (
  <Stack spacing={1.25} sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
    {rows.map((row) => {
      const roleLabel = roleLabelOf(row.role)

      return (
        <Box
          key={row.name}
          sx={(theme) => ({
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Stack spacing={0.75}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="baseline"
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
            >
              <Typography
                component="code"
                variant="body2"
                sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}
              >
                {row.name}
              </Typography>
              <Typography
                component="code"
                variant="caption"
                color="text.secondary"
              >
                {row.typeLabel}
              </Typography>
            </Stack>
            {row.title && row.title !== row.name ? (
              <Typography variant="caption" color="text.secondary">
                {row.title}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {roleLabel ? (
                <Chip size="small" label={roleLabel} variant="outlined" />
              ) : null}
              {row.required ? (
                <Chip size="small" label="required" color="primary" />
              ) : null}
            </Stack>
            {row.description ? (
              <Typography variant="body2" color="text.secondary">
                {row.description}
              </Typography>
            ) : null}
            {row.enumValues?.length ? (
              <EnumValues values={row.enumValues} />
            ) : null}
          </Stack>
        </Box>
      )
    })}
  </Stack>
)

// Some controlled vocabularies run to two dozen entries, which would swamp the
// row; show a handful and count the rest behind a tooltip.
const ENUM_PREVIEW_COUNT = 6

const EnumValues = ({ values }: { values: string[] }) => {
  const preview = values.slice(0, ENUM_PREVIEW_COUNT)
  const remainder = values.slice(ENUM_PREVIEW_COUNT)

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {preview.map((value) => (
        <Chip key={value} size="small" variant="outlined" label={value} />
      ))}
      {remainder.length ? (
        <Tooltip title={remainder.join(', ')}>
          <Chip size="small" label={`+${remainder.length} more`} />
        </Tooltip>
      ) : null}
    </Stack>
  )
}
