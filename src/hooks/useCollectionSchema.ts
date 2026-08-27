import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/providers/ocotillo-data-provider'
import {
  type CollectionSchema,
  zCollectionSchema,
} from '@/utils/collectionSchema'

/**
 * Fetches the JSON Schema an OGC collection publishes for its features.
 *
 * `?f=json` is passed explicitly: the schema path is content-negotiated and
 * serves HTML by default, so relying on the Accept header risks parsing an
 * HTML page as JSON.
 *
 * Schemas change only when the collection's shape changes, so this caches for
 * the session rather than refetching each time the modal opens.
 */
export const useCollectionSchema = (
  collectionId: string | undefined,
  options?: { enabled?: boolean }
) =>
  useQuery<CollectionSchema>({
    queryKey: ['ogcapi-collection-schema', collectionId],
    enabled: (options?.enabled ?? true) && Boolean(collectionId),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const response = await fetcher(
        `ogcapi/collections/${encodeURIComponent(collectionId as string)}/schema?f=json`
      )
      return zCollectionSchema.parse(response.data)
    },
  })
