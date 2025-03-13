import { Paper, Stack, Typography } from "@mui/material";

export const NewPointIdPreview = ({ id }: { id: string }) => (
  <Paper
    elevation={2}
    sx={{
      padding: 1,
      textAlign: "center",
      borderRadius: "4px",
      height: 55,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Stack direction="row" gap={2} justifyContent="center" alignItems="center">
      <Typography variant="subtitle1" color="primary">
        New Point ID:
      </Typography>
      <Typography variant="h6" fontWeight="bold">
        {id || "N/A"}
      </Typography>
    </Stack>
  </Paper>
);
