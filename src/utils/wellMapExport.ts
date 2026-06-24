import type { CustomParams } from '@refinedev/core'
import type { IWellDetails } from '@/interfaces/ocotillo'
import { getFeatureId } from '@/utils/mapSelection'
import {
  buildWellMapCsvEnrichmentFailedValues,
  buildWellMapCsvValues,
  dropMapCsvExcludedFeatureKeys,
  stripLegacyDetailPrefixedKeys,
} from '@/well-export/wellMapCsvExport'

export { buildWellShowAbsoluteUrl, getOcotilloPublicAppOrigin } from '@/utils/wellPublicUrls'

type CustomGetter = (params: CustomParams) => Promise<{ data: unknown }>

function ogcSiteNameFromProperties(
  cleaned: Record<string, unknown>
): string | number | undefined {
  const v = cleaned.site_name
  if (v === null || v === undefined) return undefined
  if (typeof v === 'string' || typeof v === 'number') return v
  return undefined
}

/**
 * @deprecated use buildWellMapCsvValues from @/well-export/wellMapCsvExport
 */
export function flattenWellDetailsForCsv(details: IWellDetails): Record<string, string> {
  return buildWellMapCsvValues(details)
}

const DETAIL_FETCH_CONCURRENCY = 8

/**
 * For map-export features with a numeric thing id, fetch Ocotillo well details and merge
 * flattened columns into each feature's properties.
 */
export async function enrichMapFeaturesWithWellDetails(
  features: any[],
  customRequest: CustomGetter
): Promise<any[]> {
  const uniqueIds = [
    ...new Set(
      features
        .map((f) => getFeatureId(f))
        .filter((id): id is string => typeof id === 'string' && /^\d+$/.test(id))
    ),
  ]

  const idToDetails = new Map<string, IWellDetails | 'fail'>()

  for (let i = 0; i < uniqueIds.length; i += DETAIL_FETCH_CONCURRENCY) {
    const batch = uniqueIds.slice(i, i + DETAIL_FETCH_CONCURRENCY)
    await Promise.all(
      batch.map(async (id) => {
        try {
          const response = await customRequest({
            url: `thing/water-well/${id}/details`,
            method: 'get',
          })
          const data = response.data as IWellDetails
          idToDetails.set(id, data)
        } catch {
          idToDetails.set(id, 'fail')
        }
      })
    )
  }

  return features.map((feature) => {
    const id = getFeatureId(feature)
    const raw = (feature.properties || {}) as Record<string, unknown>
    const cleaned = stripLegacyDetailPrefixedKeys(raw)
    const ogcSiteName = ogcSiteNameFromProperties(cleaned)
    const { site_name: _dropOgcSite, ...restNoOgcSite } = cleaned
    const baseProps = dropMapCsvExcludedFeatureKeys(restNoOgcSite)

    if (!id || !/^\d+$/.test(id)) {
      return { ...feature, properties: baseProps }
    }

    const det = idToDetails.get(id)
    if (det === 'fail') {
      return {
        ...feature,
        properties: {
          ...baseProps,
          ...buildWellMapCsvEnrichmentFailedValues(id, { ogcSiteName }),
        },
      }
    }
    if (det) {
      return {
        ...feature,
        properties: {
          ...baseProps,
          ...buildWellMapCsvValues(det, { ogcSiteName }),
        },
      }
    }
    return { ...feature, properties: baseProps }
  })
}
