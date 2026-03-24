import { Authenticated } from '@refinedev/core'
import { AuthPage, ErrorComponent } from '@refinedev/mui'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { ThemedLayoutV2 } from '@/components/layout'
import { ThemedHeaderV2 } from '@/components/layout/header'
import { ThemedSiderV2 } from '@/components/layout/sider'
import { ThemedTitleV2 } from '@/components/layout/title'
import { Callback } from '@/components/Auth'
import { Home } from '@/pages/home'
import { ContentPage } from '@/pages/content'
import { AMPRoutes, OcotilloRoutes, ST2Routes } from '@/routes'
import { settings } from '@/settings'
import { AppProviders } from '@/AppProviders'

const App: React.FC = () => (
  <BrowserRouter basename={settings.urlprefix}>
    <AppProviders>
      <Routes>
        <Route
          element={
            <Authenticated key={'auth-pages'} fallback={<Outlet />}>
              <Navigate to="/home" />
            </Authenticated>
          }
        >
          <Route path="/callback" element={<Callback />} />
          <Route
            path="/login"
            element={
              <AuthPage
                title={<ThemedTitleV2 collapsed={false} />}
                hideForm={true}
                type="login"
                registerLink={false}
                providers={[
                  {
                    name: 'authentik',
                    label: 'Sign in with Authentik',
                  },
                ]}
              />
            }
          />
        </Route>
        <Route
          element={
            <Authenticated key="authenticated-routes" redirectOnFail="/login">
              <ThemedLayoutV2
                Header={() => <ThemedHeaderV2 sticky />}
                Sider={ThemedSiderV2}
                Title={({ collapsed }) => (
                  <ThemedTitleV2 collapsed={collapsed} />
                )}
              >
                <Outlet />
              </ThemedLayoutV2>
            </Authenticated>
          }
        >
          <Route index element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route
            path="/about"
            element={<ContentPage src="/content/about.md" />}
          />
          <Route
            path="/report-a-bug"
            element={<ContentPage src="/content/report-a-bug.md" />}
          />
          <Route path="/amp/*" element={<AMPRoutes />} />
          <Route path="/ocotillo/*" element={<OcotilloRoutes />} />
          <Route path="/st2/*" element={<ST2Routes />} />
        </Route>
        <Route
          element={
            <Authenticated key="catch-all">
              <ThemedLayoutV2>
                <Outlet />
              </ThemedLayoutV2>
            </Authenticated>
          }
        >
          <Route path="*" element={<ErrorComponent />} />
        </Route>
      </Routes>
    </AppProviders>
  </BrowserRouter>
)

export default App
