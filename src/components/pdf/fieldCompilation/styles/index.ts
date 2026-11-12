import { StyleSheet } from '@react-pdf/renderer'
import type { IPdfDensity } from '@/interfaces'
import { chrome } from './chrome'
import { fields } from './fields'
import { images } from './images'
import { layout } from './layout'
import { measurements } from './measurements'
import { pageTwo } from './pageTwo'
import { createScale } from './scale'
import { section } from './section'
import { table } from './table'
import { writeIn } from './writeIn'

export const createFieldCompilationStyles = (
  density: IPdfDensity = 'standard'
) => {
  const scale = createScale(density)
  // Each module returns a plain literal ending in `as const`. Without it TS widens
  // string literals ('flex-start' -> string) and react-pdf's Style union rejects the
  // spread. Compile-only: runtime output is identical (golden PDFs byte-identical),
  // and the single StyleSheet.create below still validates all 81 keys.
  return StyleSheet.create({
    ...chrome(scale),
    ...layout(scale),
    ...section(scale),
    ...fields(scale),
    ...table(scale),
    ...images(scale),
    ...writeIn(scale),
    ...pageTwo(scale),
    ...measurements(scale),
  })
}

export type FieldCompilationStyles = ReturnType<
  typeof createFieldCompilationStyles
>
