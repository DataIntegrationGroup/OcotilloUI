import { PaletteMode } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'
import { MUI_BREAKPOINT_VALUES } from '@/constants/breakpoints'

/*
 * Full Tailwind v3 color palette as hex values.
 *
 * Tailwind v4 changed tailwindcss/colors to return oklch strings, which MUI's
 * palette system cannot parse. This object provides the complete v3 hex palette
 * so any color can be referenced in MUI theme overrides without hex lookups.
 *
 * These values are used exclusively by MUI (via createTheme/ThemeProvider).
 * Tailwind and shadcn/ui components read from CSS variables in index.css —
 * the two systems are independent pipelines.
 *
 * Colors that feed the current Ocotillo palette are marked with ← used.
 */
const colors = {
  white: '#ffffff',
  black: '#000000',

  /*
   * Ocotillo brand blue — the one ramp that is NOT from Tailwind.
   *
   * Sampled from the product's own artwork: the pixel water-splash mark
   * (public/images/pixel/ocotillo-splash.svg, #2C5778 / #467B96) and the
   * high-desert sky in src/img/ocotillo.jpeg. In OKLCH the whole ramp sits at
   * hue ~235-245 — a water/desert-sky blue with no violet cast, replacing the
   * off-brand indigo (hue 277) that used to own primary.
   *
   * Contrast against the app surfaces (WCAG AA needs 4.5 for text):
   *   600 on white ............ 5.57   light-mode links + contained buttons
   *   700 on white ............ 7.70   light-mode hover
   *   300 on zinc-900 ......... 9.51   dark-mode links
   *   300 on zinc-700 (paper) . 5.61   dark-mode links on cards
   *   200 on zinc-900 ........ 12.59   dark-mode hover
   *
   * Keep these values in sync with the --primary* tokens in src/index.css.
   */
  brand: {
    50:  '#eff8fd',
    100: '#dceffb',
    200: '#b8dff6', // ← primary.dark dark-mode (hover lightens)
    300: '#83c6ee', // ← primary.main dark-mode, primary.light light-mode
    400: '#47a6dd', // ← primary.light dark-mode
    500: '#1e88c4',
    600: '#0e6da8', // ← primary.main light-mode
    700: '#0f5786', // ← primary.dark light-mode
    800: '#12496e',
    900: '#143d5b', // ← .description card background dark-mode
    950: '#0d273c',
  },

  slate: {
    50:  '#f8fafc',
    100: '#f1f5f9', // ← text.primary dark
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8', // ← text.secondary dark
    500: '#64748b', // ← text.secondary light
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a', // ← text.primary light
    950: '#020617',
  },
  gray: {
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  zinc: {
    50:  '#fafafa', // ← background.default light, background.wrapper light
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46', // ← background.paper dark, divider dark
    800: '#27272a', // ← background.wrapper dark
    900: '#18181b', // ← background.default dark
    950: '#09090b',
  },
  neutral: {
    50:  '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  stone: {
    50:  '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1', // ← divider light
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },

  red: {
    50:  '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5', // ← error.light
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626', // ← error.main
    700: '#b91c1c',
    800: '#991b1b', // ← error.dark
    900: '#7f1d1d',
    950: '#450a0a',
  },
  orange: {
    50:  '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74', // ← warning.light
    400: '#fb923c',
    500: '#f97316', // ← warning.main
    600: '#ea580c',
    700: '#c2410c', // ← warning.dark
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
  amber: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d', // ← secondary.light
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706', // ← secondary.main
    700: '#b45309',
    800: '#92400e', // ← secondary.dark
    900: '#78350f',
    950: '#451a03',
  },
  yellow: {
    50:  '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },

  lime: {
    50:  '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
    950: '#1a2e05',
  },
  green: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  emerald: {
    50:  '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7', // ← success.light
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857', // ← success.main
    800: '#065f46',
    900: '#064e3b', // ← success.dark
    950: '#022c22',
  },
  teal: {
    50:  '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4', // ← info.light
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e', // ← info.main
    800: '#115e59',
    900: '#134e4a', // ← info.dark
    950: '#042f2e',
  },

  cyan: {
    50:  '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  sky: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  blue: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  indigo: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  violet: {
    50:  '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  purple: {
    50:  '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  fuchsia: {
    50:  '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },
  pink: {
    50:  '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },
  rose: {
    50:  '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
}

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
    breakpoints: {
      values: MUI_BREAKPOINT_VALUES,
    },
    palette: {
      mode,
      /*
       * Primary is mode-aware: a mid-dark brand blue reads well on the light
       * surfaces, but the same value is far too heavy on zinc-900/zinc-700, so
       * dark mode steps up the ramp instead. `dark` is MUI's hover/emphasis
       * slot, which means in dark mode it has to get *lighter*, not darker.
       */
      primary: {
        light: mode === 'dark' ? colors.brand[400] : colors.brand[300],
        main: mode === 'dark' ? colors.brand[300] : colors.brand[600],
        dark: mode === 'dark' ? colors.brand[200] : colors.brand[700],
        contrastText: mode === 'dark' ? colors.zinc[900] : colors.white,
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
      // Teal, not cyan: cyan sits ~20 degrees of hue from the brand blue and
      // the two read as the same colour when an info alert lands next to a
      // primary button. Teal stays in the water family but is unambiguous.
      info: {
        light: colors.teal[300], // teal-300
        main: colors.teal[700],  // teal-700
        dark: colors.teal[900],  // teal-900
      },
      divider: mode === 'dark' ? colors.zinc[700] : colors.stone[300],
      background: {
        default: mode === 'dark' ? colors.zinc[900] : colors.zinc[50],
        paper: mode === 'dark' ? colors.zinc[700] : colors.white,
        wrapper: mode === 'dark' ? colors.zinc[800] : colors.zinc[50],
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
            // Uses the ends of the brand ramp rather than primary.light/dark:
            // those are hover/emphasis tokens and both are now light in dark
            // mode, which would leave slate-100 body text unreadable.
            '&.description': {
              backgroundColor:
                theme.palette.mode === 'dark' ? colors.brand[900] : colors.brand[50],
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

            // Secondary Contained — an outlined button in all but name.
            // Hover tints the surface with the brand blue and darkens the
            // border; it must not fill with primary.dark, because the label is
            // primary.dark too and the two cancel out.
            ...(ownerState.variant === 'contained' &&
              ownerState.color === 'secondary' && {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark' ? `${colors.brand[300]}1F` : colors.brand[50],
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
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            fontVariantNumeric: 'tabular-nums',
          }),
          row: () => ({
            // borderTop is intentionally omitted -- it adds height outside MUI's
            // rowHeight calculation and causes the virtual scroller to overflow,
            // producing elastic-scroll bounce on macOS trackpads.
            // Row separation is handled by borderBottom on the cell slot instead.
          }),
          cell: ({ theme }) => ({
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
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 40,
            '&.Mui-expanded': {
              minHeight: 40,
            },
          },
          content: {
            margin: 0,
            padding: '12px 16px',
            '&.Mui-expanded': {
              margin: 0,
            },
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            paddingTop: 8,
          },
        },
      },
    },
  })
