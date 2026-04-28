import { INCHES_IN_A_FOOT } from '@/constants'

type ConversionOptions = {
  precision?: number // e.g. 2 → rounds to 2 decimals
  format?: boolean // if true → returns string
}

type FormatOptions = {
  precision?: number
}

// Internal helper to optionally round
const maybeRound = (num: number, precision?: number): number => {
  if (precision === undefined) return num
  const factor = Math.pow(10, precision)
  return Math.round(num * factor) / factor
}

// Internal helper to optionally format
const maybeFormat = (
  num: number,
  precision?: number,
  format?: boolean
): number | string => {
  if (!format) return num
  return precision !== undefined ? num.toFixed(precision) : String(num)
}

export const convertInchesToFeet = (
  value: number,
  options?: ConversionOptions
): number | string => {
  const result = value / INCHES_IN_A_FOOT
  const rounded = maybeRound(result, options?.precision)
  return maybeFormat(rounded, options?.precision, options?.format)
}

export const convertFeetToInches = (
  value: number,
  options?: ConversionOptions
): number | string => {
  const result = value * INCHES_IN_A_FOOT
  const rounded = maybeRound(result, options?.precision)
  return maybeFormat(rounded, options?.precision, options?.format)
}

// Generic formatter
export const formatNumber = (
  value: number | string,
  options?: FormatOptions
): string => {
  let numericValue: number

  if (typeof value === 'number') {
    numericValue = value
  } else {
    // Try to convert string → number
    numericValue = Number(value)

    if (Number.isNaN(numericValue)) {
      throw new Error(`Invalid number string: "${value}"`)
    }
  }

  if (options?.precision !== undefined) {
    return numericValue.toFixed(options.precision)
  }

  return String(numericValue)
}
