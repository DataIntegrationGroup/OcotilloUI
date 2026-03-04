import { PaletteMode } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'
import colors from 'tailwindcss/colors'

declare module '@mui/material/styles' {
  interface TypographyVariants {
    deck: React.CSSProperties
  }
  interface TypographyVariantsOptions {
    deck?: React.CSSProperties
  }
  interface TypeBackground {
    wrapper: string
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    deck: true
  }
}

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        light: colors.blue[300],  // sky-300
        main: colors.blue[700],   // sky-700
        dark: colors.blue[900],   // sky-900
      },
      secondary: {
        light: colors.amber[300], // amber-300
        main: colors.amber[600],  // amber-600
        dark: colors.amber[800],  // amber-800
      },
      error: {
        light: colors.red[300],  // red-300
        main: colors.red[600],   // red-600
        dark: colors.red[800],   // red-800
      },
      warning: {
        light: colors.orange[300], // orange-300
        main: colors.orange[500],  // orange-500
        dark: colors.orange[700],  // orange-700
      },
      success: {
        light: colors.emerald[300], // emerald-300
        main: colors.emerald[700],  // emerald-700
        dark: colors.emerald[900],  // emerald-900
      },
      info: {
        light: colors.cyan[300], // cyan-300
        main: colors.cyan[600],  // cyan-600
        dark: colors.cyan[800],  // cyan-800
      },
      divider: mode === 'dark' ? colors.zinc[700] : colors.stone[300],
      background: {
        default: mode === 'dark' ? colors.zinc[900] : colors.stone[200],
        paper: mode === 'dark' ? colors.zinc[700] : colors.white,
        wrapper: mode === 'dark' ? colors.zinc[800] : colors.stone[100],
      },
      text: {
        primary: mode === 'dark' ? colors.slate[100] : colors.slate[900],
        secondary: mode === 'dark' ? colors.slate[400] : colors.slate[500],
      },
    },

    typography: {
      fontFamily: ["'Public Sans Variable'", 'system-ui', 'sans-serif'].join(','),
      deck: {
        fontFamily: ["'Public Sans Variable'", 'system-ui', 'sans-serif'].join(','),
        fontSize: '22px',
        lineHeight: 1.5,
        fontWeight: 400,
      },
      h1: {
        fontFamily: "'Outfit Variable', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: '48px',
        lineHeight: 1.4,
        '@media (max-width:600px)': {
          fontSize: '36px',
        },
      },
      h2: {
        fontFamily: "'Outfit Variable', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: '36px',
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '28px',
        },
      },
      h3: {
        fontFamily: "'Outfit Variable', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: '28px',
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '24px',
          lineHeight: 1.6,
        },
      },
      h4: {
        fontFamily: "'Outfit Variable', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: '22px',
        lineHeight: 1.6,
        '@media (max-width:600px)': {
          fontSize: '20px',
        },
      },
      h5: {
        fontFamily: "'Outfit Variable', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: '18px',
        lineHeight: 1.6,
      },
      h6: {
        fontFamily: "'Outfit Variable', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: 1.6,
      },
      body1: {
        fontFamily: "'Public Sans Variable', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: 1.6,
        '@media (max-width:600px)': {
          fontSize: '14px',
        },
      },
      body2: {
        fontFamily: "'Public Sans Variable', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: 1.6,
      },
      caption: {
        fontFamily: "'Public Sans Variable', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: 1.5,
      },
      overline: {
        fontFamily: "'Public Sans Variable', system-ui, sans-serif",
        fontWeight: 500,
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      },
      button: {
        fontFamily: "'Public Sans Variable', system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: '0.04em',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.description': {
              backgroundColor: `${theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light}`,
              color: theme.palette.text.primary,
            },
          }),
        },
      },
      MuiButton: {
        defaultProps: {
          size: 'small',
        },
        styleOverrides: {
          sizeSmall: {
            fontSize: '0.8125rem',
            padding: '4px 12px',
          },
          sizeMedium: {
            fontSize: '0.875rem',
            padding: '6px 16px',
          },
          sizeLarge: {
            fontSize: '0.9375rem',
            padding: '8px 22px',
          },
          root: ({ ownerState, theme }) => ({
            // Primary Contained
            ...(ownerState.variant === 'contained' &&
              ownerState.color === 'primary' && {
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }),

            // Secondary Contained
            ...(ownerState.variant === 'contained' &&
              ownerState.color === 'secondary' && {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.dark}CC`,
                  color: theme.palette.primary.dark,
                  border: `1px solid ${theme.palette.primary.dark}`,
                },
              }),
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.default,
            borderRight: 'none',
          }),
        },
      },
      
      MuiDataGrid: {
        styleOverrides: {
          root: ({ theme }) => ({
            // border: 'none',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '5px',
            backgroundColor: theme.palette.background.paper,
            fontSize: '0.8125rem',
          }),
          columnHeader: ({ theme }) => ({
            // border: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            fontVariantNumeric: 'tabular-nums',
          }),
          row: ({ theme }) => ({
            // border: 'none',
            // backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
          }),
          cell: ({ theme }) => ({
            // border: 'none',
            borderBottom: `1px solid ${theme.palette.divider}`,
            fontVariantNumeric: 'tabular-nums',
          }),
          footerContainer: ({ theme }) => ({
            borderTop: `1px solid ${theme.palette.background.default}`,
            backgroundColor: theme.palette.background.paper,
          }),
        },
      },
      MuiGrid: {
        styleOverrides: {
          root: {
            paddingLeft: '0px !important',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  })
