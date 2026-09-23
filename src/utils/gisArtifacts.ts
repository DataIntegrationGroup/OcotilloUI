import { z } from 'zod'

/**
 * Schemas for the API's desktop-GIS artifact catalogue (`GET /gis?f=json`).
 *
 * These are hand-written on purpose, and only until the API branch that serves
 * `/gis` merges and deploys. The committed `openapi-auth.json` snapshot has no
 * `/gis` paths, so `src/generated` cannot describe them yet, and refreshing the
 * whole spec from the unreleased API branch would also pull in unrelated
 * unreleased endpoints and re-generate schemas the rest of the app validates
 * against. Once `/gis` is in the deployed spec, refresh it, regenerate, and
 * replace everything below with the generated zod schemas.
 *
 * Contract: docs/gis-artifact-downloads-contract.md
 */

export const zGisClient = z.enum(['qgis', 'arcgis'])

export const zGisDownload = z.object({
  client: zGisClient,
  href: z.string(),
  media_type: z.string(),
  filename: z.string(),
})

export const zGisLayer = z.object({
  id: z.string(),
  title: z.string(),
  abstract: z.string().nullish(),
  collection: z.string(),
  collection_url: z.string().nullish(),
  geometry: z.string().nullish(),
  renderer: z.enum(['single', 'graduated', 'categorized']).nullish(),
  downloads: z.array(zGisDownload),
})

export const zGisCatalog = z.object({
  service_url: z.string(),
  connections: z.array(zGisDownload),
  layers: z.array(zGisLayer),
})

export type GisClient = z.infer<typeof zGisClient>
export type GisDownload = z.infer<typeof zGisDownload>
export type GisLayer = z.infer<typeof zGisLayer>
export type GisCatalog = z.infer<typeof zGisCatalog>

export const GIS_CLIENT_LABELS: Record<GisClient, string> = {
  qgis: 'QGIS',
  arcgis: 'ArcGIS Pro',
}

/**
 * The server sends `text/xml; charset=utf-8` while the catalogue advertises
 * `text/xml`. Compare the bare type, never the raw header.
 */
export const normalizeMediaType = (mediaType: string): string =>
  mediaType.split(';')[0].trim().toLowerCase()

/**
 * Index layers by the collection they came from, so a collections row can find
 * its own artifacts. Layer ids are API-side config and change; the collection
 * id is what the datasets page already knows.
 */
export const indexGisLayersByCollection = (
  catalog: GisCatalog | undefined
): Map<string, GisLayer> => {
  const byCollection = new Map<string, GisLayer>()
  for (const layer of catalog?.layers ?? []) {
    if (!layer.collection) continue
    if (byCollection.has(layer.collection)) continue
    byCollection.set(layer.collection, layer)
  }
  return byCollection
}

/**
 * Pick the connections file for a client. The catalogue may grow more entries,
 * so match rather than index.
 */
export const findGisConnection = (
  catalog: GisCatalog | undefined,
  client: GisClient
): GisDownload | undefined =>
  catalog?.connections.find((connection) => connection.client === client)

/**
 * The authenticated connections file — public plus internal mounts — is served
 * at `/gis/qgis/connections-internal.xml` but is *not* listed in the catalogue,
 * which only advertises anonymous artifacts. Rather than rebuild the API base
 * URL here, derive it from the public entry so it still follows whichever
 * environment the catalogue came from.
 *
 * Drop this the moment the API lists the internal connection itself.
 */
export const deriveInternalGisConnection = (
  catalog: GisCatalog | undefined
): GisDownload | undefined => {
  const publicConnection = findGisConnection(catalog, 'qgis')
  if (!publicConnection) return undefined
  if (!publicConnection.href.endsWith('connections.xml')) return undefined

  return {
    ...publicConnection,
    href: publicConnection.href.replace(
      /connections\.xml$/,
      'connections-internal.xml'
    ),
    filename: publicConnection.filename.replace(
      /connections\.xml$/,
      'connections-internal.xml'
    ),
  }
}
