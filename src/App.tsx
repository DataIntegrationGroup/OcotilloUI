import { Authenticated } from '@refinedev/core'
import { ErrorComponent } from '@refinedev/mui'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { AppProviders } from '@/AppProviders'
import { AppShell } from '@/components/AppShell'
import { Callback, Login } from '@/components/Auth'
import { Home } from '@/pages/home'
import { TypographyPage } from '@/pages/example/TypographyPage'
import { DataGridPage } from '@/pages/example/DataGridPage'
import { ContentPage } from '@/pages/content'
import { OcotilloRoutes, ST2Routes } from '@/routes'
import { settings } from '@/settings'

const App: React.FC = () => (
  <BrowserRouter basename={settings.urlprefix}>
    <AppProviders>
      <Routes>
        <Route
          path="/analytics-disclosure"
          element={
            <Authenticated
              key="analytics-disclosure"
              fallback={<ContentPage src="/content/analytics-disclosure.md" />}
            >
              <AppShell />
            </Authenticated>
          }
        >
          <Route
            index
            element={<ContentPage src="/content/analytics-disclosure.md" />}
          />
        </Route>
        <Route
          element={
            <Authenticated key={'auth-pages'} fallback={<Outlet />}>
              <Navigate to="/home" />
            </Authenticated>
          }
        >
          <Route path="/callback" element={<Callback />} />
          <Route path="/login" element={<Login />} />
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
