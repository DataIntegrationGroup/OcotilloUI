import { useAutocomplete } from '@refinedev/mui'
import type { ThingResponse } from '@/generated/types.gen'

/**
 * Things, searched by name — the PointID an operator actually knows.
 *
 * The access routes take a thing id, but nobody administering consent thinks
 * in ids. Search is server-side (`name contains …`) because the well list is
 * far too long to hold in a picker.
 */
export const useThingSearch = () => {
  const { autocompleteProps } = useAutocomplete<ThingResponse>({
    resource: 'thing',
    dataProviderName: 'ocotillo',
    onSearch: (value) => [
      {
        field: 'name',
        operator: 'contains',
        value,
      },
    ],
  })

  return autocompleteProps
}
