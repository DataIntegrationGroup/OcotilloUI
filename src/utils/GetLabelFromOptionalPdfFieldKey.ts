export const getLabelFromOptionalPdfFieldKey = (key: string): string => {
  const withoutInclude = key.replace(/^include/, '')

  // Insert space before each uppercase letter (except first)
  const withSpaces = withoutInclude.replace(/([A-Z])/g, ' $1')

  return withSpaces.trim().replace(/^\w/, (c) => c.toUpperCase())
}
