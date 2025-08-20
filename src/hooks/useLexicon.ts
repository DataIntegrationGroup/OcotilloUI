import { useList } from '@refinedev/core'
import { ITerm } from '@/interfaces/ocotillo/ILexicon'

export const useLexicon = ({ category }) => {
  const data = useList<ITerm>({
    resource: 'lexicon',
    dataProviderName: 'ocotillo',
    queryOptions: {
      cacheTime: 1000 * 60 * 5, // 5 minutes
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
    meta: {
      params: { category: category },
    },
  })
  return {
    ...data,
    options:
      data.data?.data?.map((item) => ({
        value: item.term,
        label: item.term,
      })) || [],
  }
}
