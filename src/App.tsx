// ===============================================================================
// Copyright 2025 New Mexico Bureau of Geology & Mineral Resources (NMBGMR)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================

import { Authenticated, Refine } from "@refinedev/core";
import { AuthPage, ErrorComponent, RefineSnackbarProvider, useNotificationProvider, } from "@refinedev/mui";

import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { BrowserRouter, Navigate, Outlet, Route, Routes, } from "react-router-dom";

import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";

import { FiefAuthProvider } from "@fief/fief/react";

import { ampDataProvider } from "@/providers/amp-data-provider";
import { authProvider, fiefConstants } from "@/providers/fief-provider";

import { ThemedLayoutV2 } from "@/components/layout";
import { ThemedHeaderV2 } from "@/components/layout/header";
import { ThemedSiderV2 } from "@/components/layout/sider";
import { ThemedTitleV2 } from "@/components/layout/title";

import { resources } from "@/resources";
import { ColorModeContextProvider } from "@/contexts";
import { Home } from "@/pages/home";

import { geochronologyDataProvider } from "@/providers/geochronology-data-provider";

import { CriticalMineralsDashboard } from "@/pages/criticalminerals/dashboard";
import { geothermalDataProvider } from "@/providers/geothermal-data-provider";
import { settings } from "@/settings";
import { Callback } from "@/components/Auth";
import { makeAMPRoutes } from "@/routes/amp";
import { st2DataProvider } from "@/providers/st2-data-provider";
import { makeST2Routes } from "@/routes/st2";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { theme } from "./NM_WDI_theme";
import { ThemeProvider } from "@mui/material";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { makeGeothermalRoutes } from "@/routes/geothermal";
import { makeGeochronologyRoutes } from "@/routes/geochronology";

const App: React.FC = () => {
  const customTitleHandler = ({
    resource,
    action,
  }) => {
    let title = "NMBGMR Data Manager";
    if (action === "list") {
      title = `${resource.label} | ${title}`;
    }
    return title;
  };

  return (
    <BrowserRouter basename={settings.urlprefix}>
      <ColorModeContextProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
          <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                // accessControlProvider={accessControlProvider}
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
                        element={<Authenticated key={'auth-pages'} fallback={<Outlet />}
                          v3LegacyAuthProviderCompatible={true}>
                          <Navigate to="/home" />
                        </Authenticated>
                        }>
                        <Route path="/callback" element={<Callback />} />
                        <Route
                          path="/login"
                          element={
                            <AuthPage
                              title={<ThemedTitleV2
                                collapsed={false}
                                text="NMBGMR Data Manager" />}
                              hideForm={true}
                              type="login"
                              registerLink={false}
                              providers={[{
                                name: "fief",
                                label: "Sign in with Fief"
                              },]}
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
                                  // collapsed is a boolean value that indicates whether the <Sidebar> is collapsed or not
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
                        <Route path={'/home'} element={<Home />} />

                          // amp routes
                        {makeAMPRoutes()}
                          // st2 routes
                        {makeST2Routes()}

                          // geochronology routes
                        {makeGeochronologyRoutes()}

                          // criticalminerals routes
                        <Route path='/criticalminerals'>
                          <Route path="dashboard" element={<CriticalMineralsDashboard />} />
                        </Route>

                          // geothermal routes
                        {makeGeothermalRoutes()}
                      </Route>

                      {/*<Route*/}
                      {/*    // element={*/}
                      {/*    //   <Authenticated key="auth-pages" fallback={<Outlet />}>*/}
                      {/*    //     <NavigateToResource resource="Water" />*/}
                      {/*    //   </Authenticated>*/}
                      {/*    // }*/}
                      {/*>*/}
                      {/*    <Route*/}
                      {/*        path="/login"*/}
                      {/*        element={*/}
                      {/*            <AuthPage*/}
                      {/*                type="login"*/}
                      {/*                rememberMe={<RememberMe/>}*/}
                      {/*                // formProps={{*/}
                      {/*                //   defaultValues: {*/}
                      {/*                //     ...authCredentials,*/}
                      {/*                //   },*/}
                      {/*                // }}*/}
                      {/*                providers={[*/}
                      {/*                    {*/}
                      {/*                        name: "fief",*/}
                      {/*                        label: "Sign in with Fief",*/}
                      {/*                        // icon: (*/}
                      {/*                        //     <GoogleIcon*/}
                      {/*                        //         style={{*/}
                      {/*                        //             fontSize: 24,*/}
                      {/*                        //         }}*/}
                      {/*                        //     />*/}
                      {/*                        // ),*/}
                      {/*                    },*/}
                      {/*                    // {*/}
                      {/*                    //   name: "google",*/}
                      {/*                    //   label: "Sign in with Google",*/}
                      {/*                    //   icon: (*/}
                      {/*                    //     <GoogleIcon*/}
                      {/*                    //       style={{*/}
                      {/*                    //         fontSize: 24,*/}
                      {/*                    //       }}*/}
                      {/*                    //     />*/}
                      {/*                    //   ),*/}
                      {/*                    // },*/}
                      {/*                    // {*/}
                      {/*                    //   name: "github",*/}
                      {/*                    //   label: "Sign in with GitHub",*/}
                      {/*                    //   icon: (*/}
                      {/*                    //     <GitHubIcon*/}
                      {/*                    //       style={{*/}
                      {/*                    //         fontSize: 24,*/}
                      {/*                    //       }}*/}
                      {/*                    //     />*/}
                      {/*                    //   ),*/}
                      {/*                    // },*/}
                      {/*                ]}*/}
                      {/*            />*/}
                      {/*        }*/}
                      {/*    />*/}
                      {/*    <Route*/}
                      {/*        path="/register"*/}
                      {/*        element={*/}
                      {/*            <AuthPage*/}
                      {/*                type="register"*/}
                      {/*                providers={[*/}
                      {/*                    {*/}
                      {/*                        name: "google",*/}
                      {/*                        label: "Sign in with Google",*/}
                      {/*                        icon: (*/}
                      {/*                            <GoogleIcon*/}
                      {/*                                style={{*/}
                      {/*                                    fontSize: 24,*/}
                      {/*                                }}*/}
                      {/*                            />*/}
                      {/*                        ),*/}
                      {/*                    },*/}
                      {/*                    {*/}
                      {/*                        name: "github",*/}
                      {/*                        label: "Sign in with GitHub",*/}
                      {/*                        icon: (*/}
                      {/*                            <GitHubIcon*/}
                      {/*                                style={{*/}
                      {/*                                    fontSize: 24,*/}
                      {/*                                }}*/}
                      {/*                            />*/}
                      {/*                        ),*/}
                      {/*                    },*/}
                      {/*                ]}*/}
                      {/*            />*/}
                      {/*        }*/}
                      {/*    />*/}
                      {/*    <Route*/}
                      {/*        path="/forgot-password"*/}
                      {/*        element={<AuthPage type="forgotPassword"/>}*/}
                      {/*    />*/}
                      {/*    <Route*/}
                      {/*        path="/update-password"*/}
                      {/*        element={<AuthPage type="updatePassword"/>}*/}
                      {/*    />*/}
                      {/*</Route>*/}

                      <Route
                        element={
                          <Authenticated
                            v3LegacyAuthProviderCompatible={true}
                            key="catch-all">
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
        </ThemeProvider>
      </ColorModeContextProvider>
    </BrowserRouter >
  );
};

export default App;
// ============= EOF =============================================
