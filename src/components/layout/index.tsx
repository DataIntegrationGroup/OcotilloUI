import React from "react";
import { ThemedLayoutContextProvider } from "@refinedev/mui";
import { ThemedHeaderV2 as DefaultHeader } from "./header";
import { ThemedSiderV2 as DefaultSider } from "./sider";
import Box from "@mui/material/Box";
import type { RefineThemedLayoutProps } from "@refinedev/mui";

export const ThemedLayoutV2: React.FC<RefineThemedLayoutProps> = ({
  Sider,
  Header,
  Title,
  Footer,
  OffLayoutArea,
  children,
  initialSiderCollapsed,
}) => {
  const SiderToRender = Sider ?? DefaultSider;
  const HeaderToRender = Header ?? DefaultHeader;

  return (
    <ThemedLayoutContextProvider initialSiderCollapsed={initialSiderCollapsed}>
      <Box display="flex" flexDirection="row" sx={{ minHeight: '100dvh' }}>
        <SiderToRender Title={Title} />
        <Box
          sx={[
            {
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: "1px",
              minHeight: "1px",
            },
          ]}
        >
          <HeaderToRender />
          <Box
            component="main"
            sx={{
              p: { xs: 1, md: 2, lg: 1 },
              pt: 0,
              px: 0.5,
              flexGrow: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: (theme) => theme.palette.background.default,
            }}
          >
            {children}
          </Box>
          {Footer && <Footer />}
        </Box>
        {OffLayoutArea && <OffLayoutArea />}
      </Box>
    </ThemedLayoutContextProvider>
  );
};
