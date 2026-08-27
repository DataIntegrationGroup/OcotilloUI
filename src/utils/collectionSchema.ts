import { z } from 'zod'

/**
 * Schemas for the OGC API collection schema document
 * (`GET /ogcapi/collections/{id}/schema?f=json`).
 *
 * Hand-written, like `gisArtifacts.ts`: the committed `openapi-auth.json`
 * snapshot describes none of the `/ogcapi` paths, so `src/generated` cannot
 * describe this response. Replace with generated schemas once the OGC surface
 * is in the deployed spec.
 *
 * The document is JSON Schema draft 2019-09 with the OGC `x-ogc-role`
 * extension marking the id and geometry properties. Everything below `type`
 * is optional in practice: the server fills `title`/`description` for curated
 * collections and leaves them off for the rest, and the geometry property
 * carries `format` with no `type` at all.
 */

export const zSchemaProperty = z.looseObject({
  type: z.union([z.string(), z.array(z.string())]).optional(),
  format: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  enum: z.array(z.unknown()).optional(),
  'x-ogc-role': z.string().optional(),
  readOnly: z.boolean().optional(),
  nullable: z.boolean().optional(),
})

export const zCollectionSchema = z.looseObject({
  $schema: z.string().optional(),
  $id: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  required: z.array(z.string()).optional(),
  properties: z.record(z.string(), zSchemaProperty).default({}),
})

export type SchemaProperty = z.infer<typeof zSchemaProperty>
export type CollectionSchema = z.infer<typeof zCollectionSchema>

export type SchemaFieldRow = {
  name: string
  title?: string
  description?: string
  /** Rendered type label, e.g. `string`, `number (date)`, `geometry`. */
  typeLabel: string
  enumValues?: string[]
  required: boolean
  /** `id` or `primary-geometry` when the server tagged the property. */
  role?: string
}

const OGC_ROLE_LABELS: Record<string, string> = {
  id: 'Feature ID',
  'primary-geometry': 'Geometry',
  'primary-instant': 'Time',
  'primary-interval-start': 'Start time',
  'primary-interval-end': 'End time',
}

export const roleLabelOf = (role?: string): string | undefined =>
  role ? (OGC_ROLE_LABELS[role] ?? role) : undefined

/**
 * Builds the human-readable type cell. A geometry property arrives with a
 * `format` such as `geometry-any` and no `type`, so format alone has to carry
 * the label; a dated string arrives as both and reads best combined.
 */
export const typeLabelOf = (property: SchemaProperty): string => {
  const type = Array.isArray(property.type)
    ? property.type.filter((entry) => entry !== 'null').join(' | ')
    : property.type
  const format = property.format

  if (!type && format) {
    return format.startsWith('geometry') ? 'geometry' : format
  }
  if (type && format) return `${type} (${format})`
  return type || 'unknown'
}

/**
 * Flattens the schema's property bag into table rows, keeping the server's
 * key order. The id and geometry properties are hoisted to the top: they are
 * what a reader looks for first when wiring a client against a collection.
 */
export const buildSchemaFieldRows = (
  schema: CollectionSchema
): SchemaFieldRow[] => {
  const required = new Set(schema.required ?? [])

  const rows = Object.entries(schema.properties ?? {}).map(
    ([name, property]) => ({
      name,
      title: property.title,
      description: property.description,
      typeLabel: typeLabelOf(property),
      enumValues: property.enum?.map((value) => String(value)),
      required: required.has(name),
      role: property['x-ogc-role'],
    })
  )

  const rank = (row: SchemaFieldRow) => {
    if (row.role === 'id') return 0
    if (row.role === 'primary-geometry') return 1
    return 2
  }

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => rank(a.row) - rank(b.row) || a.index - b.index)
    .map(({ row }) => row)
}

export const collectionSchemaUrl = (baseApiUrl: string, collectionId: string) =>
  `${baseApiUrl.replace(/\/+$/, '')}/ogcapi/collections/${encodeURIComponent(
    collectionId
  )}/schema?f=json`
