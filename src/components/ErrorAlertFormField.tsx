import { Alert, AlertProps } from "@mui/material";

export const ErrorAlertFormField = ({
  message,
  children,
  ...props
}: {
  message?: string;
  children?: React.ReactNode;
} & AlertProps) => (
  <Alert severity="error" sx={{ height: 55 }} variant="filled" {...props}>
    {message || children || ""}
  </Alert>
);
