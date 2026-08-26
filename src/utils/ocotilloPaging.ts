import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'

/**
 * Fetch every page of an Ocotillo list resource.
 *
 * List endpoints are paginated and Refine's list hooks default to a page of
 * 25, which silently truncates dense series (transducer observations run to
 * thousands of readings per well). Callers that chart a whole series need
 * all of it, so page through until the reported total is covered.
 */
export const fetchAllOcotilloPages = async <TRow,>(
  resource: string,
  params: Record<string, string | number>,
  {
    pageSize = 1000,
    signal,
  }: { pageSize?: number; signal?: AbortSignal } = {}
): Promise<TRow[]> => {
  const listMeta = { params, ...(signal ? { signal } : {}) }

  const firstPage = await ocotilloDataProvider.getList({
    resource,
    pagination: { currentPage: 1, pageSize },
    meta: listMeta,
  })

  const totalPages = Math.max(1, Math.ceil(firstPage.total / pageSize))
  if (totalPages === 1) return firstPage.data as TRow[]

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      ocotilloDataProvider.getList({
        resource,
        pagination: { currentPage: index + 2, pageSize },
        meta: listMeta,
      })
    )
  )

  return [
    ...(firstPage.data as TRow[]),
    ...remainingPages.flatMap((page) => page.data as TRow[]),
  ]
}
