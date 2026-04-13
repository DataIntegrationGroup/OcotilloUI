import React from 'react'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import type { RefineLayoutThemedTitleProps } from '@refinedev/mui'
import { Link as RouterLink } from 'react-router'

export const ThemedTitleV2: React.FC<RefineLayoutThemedTitleProps> = ({
  collapsed,
  wrapperStyles,
}) => {
  return (
    <MuiLink
      to="/"
      component={RouterLink}
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
          Ocotillo
        </Typography>
      )}
    </MuiLink>
  )
}
