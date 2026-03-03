import { PaletteMode } from '@mui/material'
import { createTheme } from '@mui/material/styles'

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        light: '#A6CCD6', // Soft Aqua
        main: '#006E7B', // Deep Cyan
        dark: '#004153', // Deep Teal
      },
      secondary: {
        light: '#E1E4C6', // Beige Sand
        main: '#86911A', // Citron Green
        dark: '#3C410C', // Olive Green
      },
      warning: {
        light: '#F5B9B4', // Muted Rose
        main: '#C04034', // Curnt Sienna
        dark: '#5B1610', // Crimson Red
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f4f4f4',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#333',
        secondary: mode === 'dark' ? '#bbbbbb' : '#666',
      },
    },

    typography: {
      fontFamily: ["'Inter Variable'", 'system-ui', 'sans-serif'].join(','),
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
        fontFamily: "'Inter Variable', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: 1.6,
        '@media (max-width:600px)': {
          fontSize: '14px',
        },
      },
      body2: {
        fontFamily: "'Inter Variable', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: 1.6,
      },
      caption: {
        fontFamily: "'Inter Variable', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: 1.5,
      },
      overline: {
        fontFamily: "'Inter Variable', system-ui, sans-serif",
        fontWeight: 500,
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      },
      button: {
        fontFamily: "'Inter Variable', system-ui, sans-serif",
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
        styleOverrides: {
          root: ({ ownerState, theme }) => ({
            fontSize: '1rem', // Sets the base font size (1rem is typically 16px in most browsers)
            padding: '0.5em 2.5em', // Vertical padding is half the font size, horizontal padding is two and half times the font size

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
                  backgroundColor: `${theme.palette.primary.dark}CC`, // 80% opacity in HEX (CC)
                  color: theme.palette.primary.dark,
                  border: `1px solid ${theme.palette.primary.dark}`,
                },
              }),
          }),
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          cell: {
            fontVariantNumeric: 'tabular-nums',
          },
          columnHeader: {
            fontVariantNumeric: 'tabular-nums',
          },
        },
      },
      MuiGrid: {
        styleOverrides: {
          root: {
            paddingLeft: '0px !important',
          },
        },
      },
    },
  })
