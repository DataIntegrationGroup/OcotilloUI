import Grid from "@mui/material/Grid";
import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export const ReportBuilder = () => {
  return (
    <Grid container spacing={1}>
      <Grid item xs={3}>
        <Box border={1}>
          <Typography variant="h6">Report Builder</Typography>
          <Typography variant="body1">This is the report builder page</Typography>
        </Box>
      </Grid>
      <Grid item xs={9}>
        <Box border={1}>
          <Typography variant="h6">Report Builder</Typography>
          <Typography variant="body1">This is the report builder page</Typography>
          {/*<Tiptap />*/}
        </Box>
      </Grid>
    </Grid>
  );
}
