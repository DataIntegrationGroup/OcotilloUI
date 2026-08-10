import { Authenticated } from '@refinedev/core'
import { ErrorComponent } from '@refinedev/mui'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { Callback } from '@/components/Auth'
import { Home } from '@/pages/home'
import { TypographyPage } from '@/pages/example/TypographyPage'
import { ContentPage } from '@/pages/content'
import { GeothermalRoutes, OcotilloRoutes, ST2Routes } from '@/routes'
import { settings } from '@/settings'
import { AppProviders } from '@/AppProviders'
import { LoginPage } from '@/pages/auth/LoginPage'
import { OtpPage } from '@/pages/auth/OtpPage'

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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/otp" element={<OtpPage />} />
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
