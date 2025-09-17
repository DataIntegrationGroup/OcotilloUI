import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ColorModeContextProvider } from '@/contexts'
import { RefineSnackbarProvider, useNotificationProvider } from '@refinedev/mui'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { Refine } from '@refinedev/core'
import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { resources } from '@/resources'
import routerProvider from '@refinedev/react-router-v6'
import { accessControlProvider } from '@/providers/access-control-provider'
import { vi } from 'vitest'
import { getTheme } from '@/NM_WDI_theme'
import { ThemeProvider } from '@mui/material/styles'

// Mock auth provider for tests
const mockAuthProvider = {
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue({ success: true }),
  check: vi.fn().mockResolvedValue({ authenticated: true }),
  getPermissions: vi.fn().mockResolvedValue({ data: [] }),
  getAccessControlGroups: vi.fn().mockReturnValue(['Admin']),
  getIdentity: vi.fn().mockResolvedValue({ data: { id: 1, name: 'Test User' } }),
  onError: vi.fn().mockResolvedValue({})
}

export const TestProviders = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <ColorModeContextProvider>
      <ThemeProvider theme={getTheme('light')}>
      <CssBaseline />
      <GlobalStyles styles={{ html: { WebkitFontSmoothing: 'auto' } }} />
      <RefineSnackbarProvider>
        <Refine
          authProvider={mockAuthProvider}
          dataProvider={{
            default: ocotilloDataProvider,
            ocotillo: ocotilloDataProvider,
          }}
          accessControlProvider={accessControlProvider}
          routerProvider={routerProvider}
          notificationProvider={useNotificationProvider}
          resources={resources}
          options={{
            disableTelemetry: true,
            syncWithLocation: true,
            warnWhenUnsavedChanges: false,
            projectId: 'test-ocotillo'
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
            </LocalizationProvider>
          </Refine>
        </RefineSnackbarProvider>
      </ThemeProvider>
    </ColorModeContextProvider>
  )
}