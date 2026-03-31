import { Box, Stack, Typography } from '@mui/material'
import { Description } from '@mui/icons-material'
import { COMMANDS } from '@/utils/searchModal'

type CommandKey = (typeof COMMANDS)[number]['key']

type CommandResultsProps = {
  commands: readonly {
    key: CommandKey
    label: string
    description: string
  }[]
  onSelect: (command: CommandKey) => void
}

export const CommandResults = ({
  commands,
  onSelect,
}: CommandResultsProps) => (
  <Box sx={{ py: 1 }}>
    <Stack sx={{ px: 1.5, pb: 0.5 }}>
      <Typography
        variant="overline"
        sx={{ color: 'text.disabled', fontSize: 10, letterSpacing: 1 }}
      >
        Commands
      </Typography>
    </Stack>

    {commands.map((command) => (
      <Box
        key={command.key}
        onClick={() => onSelect(command.key)}
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
          sx={{
            fontSize: 18,
            color: 'text.secondary',
            flexShrink: 0,
            mt: '2px',
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {command.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {command.description}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
)
