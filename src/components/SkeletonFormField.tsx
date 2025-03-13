import { Skeleton } from "@mui/material";

export const SkeletonFormField = ({ ...props }) => (
  <Skeleton
    {...props}
    variant="rectangular"
    width="100%"
    height={55}
    sx={{ borderRadius: "4px" }}
  />
);
