export const fallbackWithDefault = <T,>(
  value: T | null | undefined,
  defaultValue: T
): T =>
  typeof value === 'string'
    ? value.trim()
      ? value
      : defaultValue
    : (value ?? defaultValue)
