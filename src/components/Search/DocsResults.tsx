import { Box, Typography } from '@mui/material'
import { Description } from '@mui/icons-material'
import { DocEntry } from '@/utils/docsSearch'
import { buildDocExcerpt } from '@/utils/searchModal'
import { highlight } from '@/utils'

type DocsResultsProps = {
  docs: DocEntry[]
  query: string
  onSelect: (doc: DocEntry) => void
}

export const DocsResults = ({ docs, query, onSelect }: DocsResultsProps) => (
  <Box sx={{ py: 0.5 }}>
    {docs.map((doc) => (
      <Box
        key={doc.id}
        onClick={() => onSelect(doc)}
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
        <Description
          sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0, mt: '2px' }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
            {highlight(doc.title, query)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.4, display: 'block' }}
          >
            {highlight(buildDocExcerpt(doc, query), query)}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
)
