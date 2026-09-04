import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material'

/**
 * The shared frame every settings section uses: a titled card with an
 * optional description, and label/value rows inside it.
 */
export const SettingRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={{ xs: 0.25, sm: 2 }}
    sx={{ py: 1 }}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ minWidth: 160, flexShrink: 0 }}
    >
      {label}
    </Typography>
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Stack>
)

export const SettingsCard = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) => (
  <Card variant="outlined" sx={{ borderRadius: 3 }}>
    <CardContent sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Box>
        <Divider />
        {children}
      </Stack>
    </CardContent>
  </Card>
)
