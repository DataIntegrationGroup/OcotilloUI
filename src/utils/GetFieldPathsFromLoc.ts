import { SchemaObjectDescription } from 'yup'

export const getFieldPathsFromLoc = (
  schemaDesc: SchemaObjectDescription,
  loc: (string | number)[]
): string[] => {
  const pathSegments = loc.map(String)

  // Recursively resolve field paths based on Yup schema.
  const resolved = resolvePathInSchema(schemaDesc, pathSegments)

  return resolved.map((segments) => segments.join('.'))
}

// Recursively walk a schema to validate and expand fields
const resolvePathInSchema = (
  schemaNode: any,
  remainingPath: string[]
): string[][] => {
  if (!schemaNode) return []

  const [current, ...rest] = remainingPath

  // Handle array indices
  if (!isNaN(Number(current))) {
    const arrayItemSchema = schemaNode.innerType

    if (arrayItemSchema.type === 'object' && arrayItemSchema.fields) {
      // If this is the last segment, expand all child fields
      if (rest.length === 0) {
        return Object.keys(arrayItemSchema.fields).map((key) => [
          `${current}`,
          key,
        ])
      }

      const subResults = resolvePathInSchema(arrayItemSchema, rest)
      return subResults.map((subPath) => [`${current}`, ...subPath])
    } else {
      return [[`${current}`]]
    }
  }

  const currentField = schemaNode.fields ? schemaNode.fields[current] : null

  // If this is the last path segment
  if (rest.length === 0) {
    if (currentField?.type === 'object' && currentField?.fields) {
      // Expand to its child fields
      return Object.keys(currentField.fields).map((key) => [current, key])
    } else {
      return [[current]]
    }
  }

  // Continue recursing down the path
  const subResults = resolvePathInSchema(currentField, rest)
  return subResults.map((subPath) => [current, ...subPath])
}
