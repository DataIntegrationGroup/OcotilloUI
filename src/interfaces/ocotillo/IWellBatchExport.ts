import { BaseRecord } from '@refinedev/core'
import type { IContact } from './IContact'
import type { IObservation } from './IObservation'
import type { IWell } from './IWell'

export type WellChipState = {
  query: string
  status: 'resolved' | 'error'
  wellId?: number
}

export type WellBundle = {
  well: IWell
  contacts: IContact[]
  assets: BaseRecord[]
  observations: readonly Partial<IObservation>[]
}
