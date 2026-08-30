import {
  CircularProgress,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useCan } from '@refinedev/core'
import { ErrorComponent } from '@refinedev/mui'
import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router'

export const ACCESS_TABS = [
  {
    path: '/access/grants',
    label: 'Grants',
    description:
      'Who may read, enter, correct, or administer each kind of data, and for how long. Revoking takes effect at the next read, not at the next sign-in.',
  },
  {
    path: '/access/destinations',
    label: 'Destinations',
    description:
      'The places published data is offered to, and what each one may currently read.',
  },
  {
    path: '/access/consent',
    label: 'Consent',
    description:
      'Where an owner agreed to publish one kind of data to one destination. Withdrawing stops the offer; copies already harvested are not recalled.',
  },
] as const

/**
 * Shared shell for the three access-control tabs.
 *
 * Grants, destinations, and consent are one subject read three ways — a grant
 * says who may see data, consent says where it may go, and a destination is
 * the place it goes — so they share a page rather than sitting in three
 * unrelated corners of the nav. Each tab keeps its own route so a link into
 * one still works.
 *
 * The whole console is gated once, here: every route underneath is
 * admin-only, and checking in one place keeps a tab from rendering its
 * loading state before deciding the reader is not allowed to see it.
 */
export const AccessConsole = ({
  activePath,
  children,
}: {
  activePath: (typeof ACCESS_TABS)[number]['path']
  children: ReactNode
}) => {
  const { data: access, isLoading } = useCan({
    action: 'manage',
    resource: 'ocotillo.access-grants',
  })
  const location = useLocation()
  const active =
    ACCESS_TABS.find((tab) => location.pathname.startsWith(tab.path))?.path ??
    activePath
  const description = ACCESS_TABS.find(
    (tab) => tab.path === active
  )?.description

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (!access?.can) return <ErrorComponent />

  // Full width, like the datasets table: eight columns of grants do not fit a
  // reading-width container without wrapping every cell.
  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <Typography variant="h4">Access Control</Typography>
          <Tabs
            value={active}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {ACCESS_TABS.map((tab) => (
              <Tab
                key={tab.path}
                value={tab.path}
                label={tab.label}
                component={RouterLink}
                to={tab.path}
              />
            ))}
          </Tabs>
          {description ? (
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </Container>
  )
}
