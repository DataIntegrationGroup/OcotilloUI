import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ColorModeContextProvider } from "@/contexts";
import {
  RefineSnackbarProvider,
  useNotificationProvider,
} from "@refinedev/mui";
import { DevtoolsProvider, DevtoolsPanel } from "@refinedev/devtools";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { FiefAuthProvider } from "@fief/fief/react";
import { authProvider, fiefConstants } from "@/providers/fief-provider";
import { Refine } from "@refinedev/core";
import { ampDataProvider } from "./providers/amp-data-provider";
import { geochronologyDataProvider } from "./providers/geochronology-data-provider";
import { geothermalDataProvider } from "./providers/geothermal-data-provider";
import { st2DataProvider } from "./providers/st2-data-provider";
import { resources } from "./resources";
import routerProvider, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";

const queryClient = new QueryClient();
const customTitleHandler = ({ resource, action }) =>
  action === "list"
    ? `${resource.label} | NMBGMR Data Manager`
    : "NMBGMR Data Manager";

export const Providers = ({ children }: { children: ReactNode }) => (
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
            <QueryClientProvider client={queryClient}>
              <FiefAuthProvider
                baseURL={fiefConstants.baseURL}
                clientId={fiefConstants.clientId}
              >
                {children}
              </FiefAuthProvider>
            </QueryClientProvider>
          </LocalizationProvider>
        </Refine>
        <DevtoolsPanel />
      </DevtoolsProvider>
    </RefineSnackbarProvider>
  </ColorModeContextProvider>
);
