import { useList } from '@refinedev/core'
import type { GroupResponse } from '@/generated/types.gen'

/**
 * Groups, for pickers that need to name one.
 *
 * The API stores a group by id and the access routes take that id, but nobody
 * administering access knows it — they know the name. Everything that asks for
 * a group scope reads from here so the id stays an implementation detail.
 */
export const useGroups = () => {
  const data = useList<GroupResponse>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    // Well past the number of groups that exist; a picker that pages is worse
    // than one that loads the lot once.
    pagination: { pageSize: 500 },
    queryOptions: {
      gcTime: 1000 * 60 * 5,
      staleTime: 1000 * 60 * 2,
    },
  })

  const groups = [...(data.result?.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return {
    groups,
    isLoading: data.query.isLoading,
    options: groups.map((group) => ({
      value: String(group.id),
      label: group.name,
    })),
  }
}
