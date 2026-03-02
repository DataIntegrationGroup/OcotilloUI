import { st2Resources } from '@/resources/st2'
import { ocotilloResources } from '@/resources/ocotillo'

// No parent group: ocotillo items are top-level in the sidebar (Map, Wells, etc.)
export const resources = [...ocotilloResources /* ...st2Resources */]
