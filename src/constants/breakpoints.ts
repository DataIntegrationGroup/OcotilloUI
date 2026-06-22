/**
 * Canonical Ocotillo responsive breakpoints.
 * Keep in sync with @theme breakpoints in index.css and MUI theme.breakpoints.values.
 */
export const SCREENS = {
  card: '160px',
  'card-lg': '240px',
  mobile: '320px',
  'mobile-lg': '480px',
  tablet: '640px',
  'tablet-lg': '880px',
  desktop: '1024px',
  'desktop-lg': '1256px',
  widescreen: '1400px',
} as const

export type ScreenName = keyof typeof SCREENS

/** Numeric px values for JS (matchMedia, ResizeObserver). */
export const SCREEN_PX: Record<ScreenName, number> = {
  card: 160,
  'card-lg': 240,
  mobile: 320,
  'mobile-lg': 480,
  tablet: 640,
  'tablet-lg': 880,
  desktop: 1024,
  'desktop-lg': 1256,
  widescreen: 1400,
}

/** Viewport below this width uses mobile shell behavior (sidebar sheet, full-screen panels). */
export const MOBILE_VIEWPORT_MAX_PX = SCREEN_PX.tablet

/** Well detail main body switches to two columns at this content width. */
export const WELL_SHOW_TWO_COLUMN_MIN_PX = SCREEN_PX['tablet-lg']

/** CoreWellInfo stats bar switches from stacked to three columns. */
export const CORE_WELL_INFO_STATS_MIN_PX = SCREEN_PX['mobile-lg']

/** MUI breakpoint.values aligned to SCREENS. */
export const MUI_BREAKPOINT_VALUES = {
  xs: 0,
  sm: SCREEN_PX['mobile-lg'],
  md: SCREEN_PX['tablet-lg'],
  lg: SCREEN_PX.desktop,
  xl: SCREEN_PX['desktop-lg'],
} as const
