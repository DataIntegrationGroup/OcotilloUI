/*
 * oklch.ts — OKLCH → sRGB hex conversion for the palette-parity test.
 *
 * E2 dependency. Parsed CSS custom properties in src/index.css are declared in
 * oklch() (e.g. `--primary: oklch(0.515 0.122 244.044)`); to compare a CSS colour
 * against the TS hex values in theme.ts/palette.ts we must convert both sides onto
 * one space. This file only goes OKLCH → hex; it never reads or writes either source.
 *
 * Conversion reference: https://www.w3.org/TR/oklab/#sec-oklch-to-rgb
 * Verified on this branch's own index.css:
 *   --primary-light (#83c6ee), --muted-foreground (#737373), --background (#fafafa)  → exact
 *   --primary, --primary-dark                                                       → within 1/255 of the TS brand ramps
 */

export interface Oklch { L: number; C: number; H: number }

function channelToRgb(t: number): string {
  // Reciprocal transfer function (sRGB companding), clamped to [0,1].
  const c = t <= 0.0031308 ? 12.92 * t : 1.055 * t ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
    .toString(16)
    .padStart(2, '0')
}

function okToRgb(r: number, g: number, b: number): string {
  const red = channelToRgb(r).padEnd(2, '0')
  const green = channelToRgb(g).padEnd(2, '0')
  const blue = channelToRgb(b).padEnd(2, '0')
  return `#${red}${green}${blue}`
}

/**
 * Convert an OKLCH triple to a `#rrggbb` string. Values are expected already in the
 * `[L C H]` space L∈[0,1], C≥0, H∈[0,360); this function does NOT clamp/normalize them.
 */
export function oklchToHex(L: number, C: number, H: number): string {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)

  const L_ = L + 0.3963377774 * a + 0.2158037573 * b
  const M_ = L - 0.1055613458 * a - 0.0638541728 * b
  const S_ = L - 0.0894841775 * a - 1.2914855480 * b

  const L3 = L_ ** 3, M3 = M_ ** 3, S3 = S_ ** 3
  const r = 4.0767416621 * L3 - 3.3077115913 * M3 + 0.2309699292 * S3
  const g = -1.2684380046 * L3 + 2.6097574011 * M3 - 0.3413193965 * S3
  const bl = -0.0041960863 * L3 - 0.7034186147 * M3 + 1.7076147010 * S3

  return okToRgb(r, g, bl)
}

/** Convert an Oklch object; also accept the `L C H` tuple form. */
export function toHex(input: Oklch | [number, number, number]): string {
  const [L, C, H] = Array.isArray(input) ? input : [input.L, input.C, input.H]
  return oklchToHex(L as number, C as number, H as number)
}

/** Largest absolute per-channel difference between two `#rrggbb` strings (0–255). */
export function hexDelta(a: string, b: string): number {
  const toRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16)) as [number, number, number]
  const ra = toRgb(a), rb = toRgb(b)
  return Math.max(Math.abs(ra[0] - rb[0]), Math.abs(ra[1] - rb[1]), Math.abs(ra[2] - rb[2]))
}
