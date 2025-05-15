import { ampApiFetch } from '@/utils'

export const fetchLookupTable = async (table: string): Promise<any> => {
  return await ampApiFetch(
    `authorized/lookuptable/${table}`,
    `Failed to fetch ${table} options`
  )
}
