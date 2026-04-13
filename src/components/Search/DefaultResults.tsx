import { Box, Chip, Divider, Typography } from '@mui/material'
import { Description, Opacity, Person } from '@mui/icons-material'
import { GroupType } from '@/constants'
import { ContactResult, SearchResult, WellResult } from '@/interfaces/ocotillo'
import { highlight } from '@/utils'

const TypeIcon = ({ group }: { group: GroupType }) => {
  const sx = { fontSize: 18, color: 'text.secondary', flexShrink: 0, mt: '2px' }

  switch (group) {
    case GroupType.Wells:
    case GroupType.Springs:
      return <Opacity sx={sx} />
    case GroupType.Contacts:
      return <Person sx={sx} />
    case GroupType.Assets:
      return <Description sx={sx} />
    default:
      return null
  }
}

const buildSubtitle = (option: SearchResult): string | null => {
  if (option.group === GroupType.Wells || option.group === GroupType.Springs) {
    const properties = (option as WellResult).properties
    const parts: string[] = []

    if (properties.owner_name) parts.push(`Owner: ${properties.owner_name}`)
    if (properties.county) parts.push(properties.county)
    if (properties.site_name) parts.push(properties.site_name)
    if (properties.thing_type) parts.push(properties.thing_type)
    if (properties.well_depth)
      parts.push(`${properties.well_depth.toFixed(0)} ft`)
    if (properties.hole_depth) {
      parts.push(`hole ${properties.hole_depth.toFixed(0)} ft`)
    }
    if (properties.well_purposes?.length)
      parts.push(...properties.well_purposes)

    return parts.length ? parts.join('  ·  ') : null
  }

  if (option.group === GroupType.Contacts) {
    const properties = (option as ContactResult).properties
    const parts: string[] = []

    if (properties.phone?.length) parts.push(properties.phone[0])
    if (properties.address?.length) parts.push(properties.address[0])

    return parts.length ? parts.join('  ·  ') : null
  }

  return null
}

const RelatedThings = ({
  things,
  query,
}: {
  things: { id: number; label: string; thing_type: string }[]
  query: string
}) => {
  if (!things?.length) return null

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
      {things.slice(0, 4).map((thing) => (
        <Chip
          key={thing.id}
          size="small"
          icon={<Opacity sx={{ fontSize: '12px !important' }} />}
          label={highlight(thing.label, query)}
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      ))}
      {things.length > 4 && (
        <Chip
          size="small"
          label={`+${things.length - 4} more`}
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      )}
    </Box>
  )
}

const ResultRow = ({
  option,
  query,
  onClick,
}: {
  option: SearchResult
  query: string
  onClick: () => void
}) => {
  const subtitle = buildSubtitle(option)
  const relatedThings =
    option.group === GroupType.Contacts
      ? (option as ContactResult).properties.things
      : option.group === GroupType.Assets
        ? (option as any).properties?.things
        : null

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <TypeIcon group={option.group} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
          {highlight(option.label, query)}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.4, display: 'block' }}
          >
            {subtitle}
          </Typography>
        )}
        {relatedThings && (
          <RelatedThings things={relatedThings} query={query} />
        )}
      </Box>
    </Box>
  )
}

type DefaultResultsProps = {
  grouped: Map<GroupType, SearchResult[]>
  query: string
  onSelect: (result: SearchResult) => void
}

export const DefaultResults = ({
  grouped,
  query,
  onSelect,
}: DefaultResultsProps) => (
  <Box sx={{ py: 0.5 }}>
    {Array.from(grouped.entries()).map(([group, items], groupIndex) => (
      <Box key={group}>
        {groupIndex > 0 && <Divider sx={{ my: 0.5 }} />}
        {items.map((option, index) => (
          <ResultRow
            key={`${option.group}-${(option as any).properties?.id ?? index}`}
            option={option}
            query={query}
            onClick={() => onSelect(option)}
          />
        ))}
      </Box>
    ))}
  </Box>
)
