import type { GisLayer } from '@/utils/gisArtifacts'
import type { OgcCollectionRecord } from '@/utils/ogcLayerUtils'

/**
 * Shared field-resolution for the datasets page. The OGC catalogue is not
 * consistent about which of these fields it fills in, and the card view and
 * the table view have to agree on what a collection is called.
 */

export const collectionIdOf = (
  collection: OgcCollectionRecord
): string | undefined =>
  collection.id || collection.collection_id || collection.name || undefined

export const collectionTitleOf = (
  collection: OgcCollectionRecord,
  displayLabel?: string
): string =>
  displayLabel ||
  collection.title ||
  collection.name ||
  collection.id ||
  collection.collection_id ||
  'Untitled collection'

export const collectionDescriptionOf = (
  collection: OgcCollectionRecord
): string | undefined => collection.description || collection.abstract

export type CollectionsTableRow<GroupKey extends string = string> = {
  groupKey: GroupKey
  groupTitle: string
  layerKey: string
  title: string
  id?: string
  description?: string
  gisLayer?: GisLayer
}

type GroupLike<GroupKey extends string = string> = {
  key: GroupKey
  title: string
  collections: {
    layerKey: string
    collection: OgcCollectionRecord
    displayLabel?: string
  }[]
}

/**
 * Flattens the grouped cards into one list for the table view, keeping the
 * group on each row so the table can tint it. The point of the table is
 * scanning every dataset at once, which four separate cards prevent.
 */
export const buildCollectionRows = <GroupKey extends string>(
  groups: GroupLike<GroupKey>[],
  gisLayersByCollection: Map<string, GisLayer>
): CollectionsTableRow<GroupKey>[] =>
  groups.flatMap((group) =>
    group.collections.map(({ layerKey, collection, displayLabel }) => {
      const id = collectionIdOf(collection)

      return {
        groupKey: group.key,
        groupTitle: group.title,
        layerKey,
        title: collectionTitleOf(collection, displayLabel),
        id,
        description: collectionDescriptionOf(collection),
        gisLayer: id ? gisLayersByCollection.get(id) : undefined,
      }
    })
  )
