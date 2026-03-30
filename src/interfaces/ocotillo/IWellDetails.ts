import type { IContact } from './IContact'
import type { IObservation } from './IObservation'
import type { ISample } from './ISample'
import type { ISensor } from './ISensor'
import type { IWell } from './IWell'
import type { IWellScreen } from './IWellScreen'

export type IWellDetails = {
  well: IWell
  contacts: IContact[]
  sensors: ISensor[]
  deployments: any[]
  well_screens: IWellScreen[]
  recent_groundwater_level_observations: IObservation[]
  latest_field_event_sample: ISample | null
}
