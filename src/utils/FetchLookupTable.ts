import { apiFetch } from '@/utils'

export const fetchLookupTable = async (table: string): Promise<any> => {
  return await apiFetch({
    endpoint: `authorized/lookuptable/${table}`,
    failureMessage: `Failed to fetch ${table} options`,
  })
}
