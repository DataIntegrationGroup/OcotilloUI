import { useList } from '@refinedev/core'
import { ITerm } from '@/interfaces/ocotillo/ILexicon'

type UseLexiconProps = {
  category: string
}

export const useLexicon = ({ category }: UseLexiconProps) => {
  const data = useList<ITerm>({
    resource: 'lexicon/term',
    dataProviderName: 'ocotillo',
    queryOptions: {
      gcTime: 1000 * 60 * 5, // 5 minutes
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
    meta: {
      params: { category: category },
    },
  })
  return {
    ...data,
    isLoading: data.query.isLoading,
    options:
      data.result?.data?.map((item) => ({
        value: item.term,
        label: item.term,
      })) || [],
  }
}
