import type { IContact } from './IContact'
import type { IFieldEvent } from './IFieldEvent'
import type { ISensor } from './ISensor'
import type { IWell } from './IWell'
import type { IWellScreen } from './IWellScreen'

export type IWellDetails = {
  well: IWell
  contacts: IContact[]
  sensors: ISensor[]
  deployments: any[]
  well_screens: IWellScreen[]
  field_events: IFieldEvent[]
}
