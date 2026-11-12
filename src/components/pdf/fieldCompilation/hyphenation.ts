import { Font } from '@react-pdf/renderer'

/**
 * react-pdf splits a word that does not fit the line by inserting a hyphen at an
 * arbitrary character ("ca-" / "ble"), which both looks wrong on a field sheet
 * and corrupts text extraction: `pdftotext` returns "ca-\nble", so a wrapped
 * Site Note no longer matches its own text.
 *
 * Returning the word as a single chunk disables that split. Wrapping still
 * happens at real spaces and at hyphens that are part of the word.
 */
let registered = false

export function registerNoHyphenation(): void {
  if (registered) return
  Font.registerHyphenationCallback((word) => [word])
  registered = true
}
