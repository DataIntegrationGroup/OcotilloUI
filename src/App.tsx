import { Authenticated, Refine } from "@refinedev/core";
import {
  AuthPage,
  ErrorComponent,
  RefineSnackbarProvider,
  useNotificationProvider,
} from "@refinedev/mui";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { FiefAuthProvider } from "@fief/fief/react";
import { ThemedLayoutV2 } from "@/components/layout";
import { ThemedHeaderV2 } from "@/components/layout/header";
import { ThemedSiderV2 } from "@/components/layout/sider";
import { ThemedTitleV2 } from "@/components/layout/title";
import { ColorModeContextProvider } from "@/contexts";
import { Home } from "@/pages/home";
import { CriticalMineralsDashboard } from "@/pages/criticalminerals/dashboard";
import { Callback } from "@/components/Auth";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { AMPRoutes } from "@/routes/amp";
import { ST2Routes } from "@/routes/st2";
import { GeothermalRoutes } from "@/routes/geothermal";
import { GeochronologyRoutes } from "@/routes/geochronology";
import { resources } from "@/resources";
import { ampDataProvider } from "@/providers/amp-data-provider";
import { authProvider, fiefConstants } from "@/providers/fief-provider";
import { geochronologyDataProvider } from "@/providers/geochronology-data-provider";
import { settings } from "@/settings";
import { geothermalDataProvider } from "@/providers/geothermal-data-provider";
import { st2DataProvider } from "@/providers/st2-data-provider";

const App: React.FC = () => {
  const customTitleHandler = ({ resource, action }) =>
    action === "list"
      ? `${resource.label} | NMBGMR Data Manager`
      : "NMBGMR Data Manager";

  return (
    <BrowserRouter basename={settings.urlprefix}>
      <ColorModeContextProvider>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        <RefineSnackbarProvider>
          <DevtoolsProvider>
            <Refine
              authProvider={authProvider}
              dataProvider={{
                default: ampDataProvider,
                amp: ampDataProvider,
                geochronology: geochronologyDataProvider,
                geothermal: geothermalDataProvider,
                st2: st2DataProvider,
              }}
              routerProvider={routerProvider}
              notificationProvider={useNotificationProvider}
              resources={resources}
              options={{
                disableTelemetry: true,
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "wCqQ1f-agx0FN-70pXIr",
              }}
            >
              <UnsavedChangesNotifier />
              <DocumentTitleHandler handler={customTitleHandler} />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <FiefAuthProvider
                  baseURL={fiefConstants.baseURL}
                  clientId={fiefConstants.clientId}
                >
                  <Routes>
                    <Route
                      element={
                        <Authenticated
                          key={"auth-pages"}
                          fallback={<Outlet />}
                          v3LegacyAuthProviderCompatible={true}
                        >
                          <Navigate to="/home" />
                        </Authenticated>
                      }
                    >
                      <Route path="/callback" element={<Callback />} />
                      <Route
                        path="/login"
                        element={
                          <AuthPage
                            title={
                              <ThemedTitleV2
                                collapsed={false}
                                text="NMBGMR Data Manager"
                              />
                            }
                            hideForm={true}
                            type="login"
                            registerLink={false}
                            providers={[
                              {
                                name: "fief",
                                label: "Sign in with Fief",
                              },
                            ]}
                          />
                        }
                      />
                    </Route>
                    <Route
                      element={
                        <Authenticated
                          key="authenticated-routes"
                          redirectOnFail={"/login"}
                          v3LegacyAuthProviderCompatible={true}
                        >
                          <ThemedLayoutV2
                            Header={() => <ThemedHeaderV2 sticky />}
                            Sider={ThemedSiderV2}
                            Title={({ collapsed }) => (
                              <ThemedTitleV2
                                collapsed={collapsed}
                                text="NMBGMR Data Manager"
                              />
                            )}
                          >
                            <Outlet />
                          </ThemedLayoutV2>
                        </Authenticated>
                      }
                    >
                      <Route index element={<Home />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/amp/*" element={<AMPRoutes />} />
                      <Route path="/st2/*" element={<ST2Routes />} />
                      <Route
                        path="/geochronology/*"
                        element={<GeochronologyRoutes />}
                      />
                      <Route path="/criticalminerals">
                        <Route
                          path="dashboard"
                          element={<CriticalMineralsDashboard />}
                        />
                      </Route>
                      <Route
                        path="/geothermal/*"
                        element={<GeothermalRoutes />}
                      />
                    </Route>
                    <Route
                      element={
                        <Authenticated
                          v3LegacyAuthProviderCompatible={true}
                          key="catch-all"
                        >
                          <ThemedLayoutV2>
                            <Outlet />
                          </ThemedLayoutV2>
                        </Authenticated>
                      }
                    >
                      <Route path="*" element={<ErrorComponent />} />
                    </Route>
                  </Routes>
                </FiefAuthProvider>
              </LocalizationProvider>
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </RefineSnackbarProvider>
      </ColorModeContextProvider>
    </BrowserRouter>
  );
};

export default App;
