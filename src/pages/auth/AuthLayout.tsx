import { ReactNode } from 'react'
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import { ThemedTitleV2 } from '@/components/layout/title'

export const AuthLayout = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) => (
  <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
    <Stack spacing={3} alignItems="center">
      <ThemedTitleV2 collapsed={false} />
      <Card elevation={3} sx={{ width: '100%', borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography component="h1" variant="h5" fontWeight={700}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            </Box>
            {children}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  </Container>
)
