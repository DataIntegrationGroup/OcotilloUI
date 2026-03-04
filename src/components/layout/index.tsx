import React from "react";
import { ThemedLayoutContextProvider } from "@refinedev/mui";
import { ThemedHeaderV2 as DefaultHeader } from "./header";
import { ThemedSiderV2 as DefaultSider } from "./sider";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import type { RefineThemedLayoutV2Props } from "@refinedev/mui";

export const ThemedLayoutV2: React.FC<RefineThemedLayoutV2Props> = ({
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
      <Box display="flex" flexDirection="row">
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
              px:0.5,
              flexGrow: 1,
              bgcolor: (theme) => theme.palette.background.default,
            }}
          >
            <Grid container columns={{ xs: 4, md: 12 }}>
              {children}
            </Grid>
          </Box>
          {Footer && <Footer />}
        </Box>
        {OffLayoutArea && <OffLayoutArea />}
      </Box>
    </ThemedLayoutContextProvider>
  );
};
