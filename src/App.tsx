import { Authenticated } from '@refinedev/core'
import { AuthPage, ErrorComponent } from '@refinedev/mui'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { ThemedTitleV2 } from '@/components/layout/title'
import { Callback } from '@/components/Auth'
import { Home } from '@/pages/home'
import { TypographyPage } from '@/pages/example/TypographyPage'
import { DataGridPage } from '@/pages/example/DataGridPage'
import { ContentPage } from '@/pages/content'
import { GeothermalRoutes, OcotilloRoutes, ST2Routes } from '@/routes'
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
              <AppShell />
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
          <Route
            path="/ogcapi"
            element={<ContentPage src="/content/ogcapi.md" />}
          />
          {/* TEMPORARY: example specimen pages */}
          <Route path="/example/typography" element={<TypographyPage />} />
          <Route path="/example/data-grid" element={<DataGridPage />} />
          <Route path="/ocotillo/*" element={<OcotilloRoutes />} />
          <Route path="/geothermal/*" element={<GeothermalRoutes />} />
          <Route path="/st2/*" element={<ST2Routes />} />
        </Route>
        <Route
          element={
            <Authenticated key="catch-all">
              <AppShell />
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
