import React from "react";
import {
  useRouterContext,
  useLink,
  useRouterType,
} from "@refinedev/core";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { RefineLayoutThemedTitleProps } from "@refinedev/mui";

export const ThemedTitleV2: React.FC<RefineLayoutThemedTitleProps> = ({
  collapsed,
  wrapperStyles,
}) => {
  const routerType = useRouterType();
  const Link = useLink();
  const { Link: LegacyLink } = useRouterContext();

  const ActiveLink = routerType === "legacy" ? LegacyLink : Link;

  return (
    <MuiLink
      to="/"
      component={ActiveLink}
      underline="none"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        ...wrapperStyles,
      }}
    >
      {collapsed ? (
        <Typography
          component="span"
          sx={{
            fontFamily: "'Outfit Variable', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "1.25rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "text.primary",
            lineHeight: 1,
          }}
        >
          O
        </Typography>
      ) : (
        <Typography
          component="span"
          sx={{
            fontFamily: "'Outfit Variable', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "text.primary",
            lineHeight: 1,
          }}
        >
          OCOTILLO
        </Typography>
      )}
    </MuiLink>
  );
};
