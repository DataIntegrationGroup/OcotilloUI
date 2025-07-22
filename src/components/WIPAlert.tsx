import { Alert, AlertTitle, Typography } from "@mui/material";

export const WIPAlert = () =>
(
  <Alert variant="filled" severity="warning" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <AlertTitle>Alert!</AlertTitle>
    <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
      This page is under active development!
    </Typography>
  </Alert>
);
