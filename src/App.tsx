import {Authenticated} from "@refinedev/core";
import {AuthPage, ErrorComponent} from "@refinedev/mui";
import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
} from "react-router-dom";
import {ThemedLayoutV2} from "@/components/layout";
import {ThemedHeaderV2} from "@/components/layout/header";
import {ThemedSiderV2} from "@/components/layout/sider";
import {ThemedTitleV2} from "@/components/layout/title";
import {Home} from "@/pages/home";
import {CriticalMineralsDashboard} from "@/pages/criticalminerals/dashboard";
import {Callback} from "@/components/Auth";
import {AMPRoutes} from "@/routes/amp";
import {ST2Routes} from "@/routes/st2";
import {GeothermalRoutes} from "@/routes/geothermal";
import {GeochronologyRoutes} from "@/routes/geochronology";
import {settings} from "@/settings";
import {Providers} from "./Providers";
import {MapStudioViewer} from "@/pages/mapstudio";

const App: React.FC = () => (
    <BrowserRouter basename={settings.urlprefix}>
        <Providers>
            <Routes>
                <Route
                    element={
                        <Authenticated
                            key={"auth-pages"}
                            fallback={<Outlet/>}
                            v3LegacyAuthProviderCompatible={true}
                        >
                            <Navigate to="/home"/>
                        </Authenticated>
                    }
                >
                    <Route path="/callback" element={<Callback/>}/>
                    <Route
                        path="/login"
                        element={
                            <AuthPage
                                title={
                                    <ThemedTitleV2 collapsed={false} text="NMBGMR Data Manager"/>
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
                            redirectOnFail="/login"
                            v3LegacyAuthProviderCompatible={true}
                        >
                            <ThemedLayoutV2
                                Header={() => <ThemedHeaderV2 sticky/>}
                                Sider={ThemedSiderV2}
                                Title={({collapsed}) => (
                                    <ThemedTitleV2
                                        collapsed={collapsed}
                                        text="NMBGMR Data Manager"
                                    />
                                )}
                            >
                                <Outlet/>
                            </ThemedLayoutV2>
                        </Authenticated>
                    }
                >
                    <Route index element={<Home/>}/>
                    <Route path="/home" element={<Home/>}/>
                    <Route path="/amp/*" element={<AMPRoutes/>}/>
                    <Route path="/st2/*" element={<ST2Routes/>}/>
                    <Route path="/geochronology/*" element={<GeochronologyRoutes/>}/>
                    <Route path="/criticalminerals">
                        <Route path="dashboard" element={<CriticalMineralsDashboard/>}/>
                    </Route>
                    <Route path="/geothermal/*" element={<GeothermalRoutes/>}/>
                    <Route path="/mapstudio/viewer" element={<MapStudioViewer/>}/>
                </Route>
                <Route
                    element={
                        <Authenticated
                            v3LegacyAuthProviderCompatible={true}
                            key="catch-all"
                        >
                            <ThemedLayoutV2>
                                <Outlet/>
                            </ThemedLayoutV2>
                        </Authenticated>
                    }
                >
                    <Route path="*" element={<ErrorComponent/>}/>
                </Route>
            </Routes>
        </Providers>
    </BrowserRouter>
);

export default App;
