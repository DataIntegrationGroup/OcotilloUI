declare module './DrawControl' {
  import type { ComponentType } from 'react'
  const DrawControl: ComponentType<Record<string, unknown>>
  export default DrawControl
}

declare module '../DrawControl' {
  import type { ComponentType } from 'react'
  const DrawControl: ComponentType<Record<string, unknown>>
  export default DrawControl
}

declare module '*.jsx' {
  import type { ComponentType } from 'react'
  const component: ComponentType<Record<string, unknown>>
  export default component
}
