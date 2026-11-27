import { BaseRecord } from '@refinedev/core'
import type { IContact } from './IContact'
import type { IObservation } from './IObservation'
import type { IWell } from './IWell'
import type { SensorDeploymentRow } from '@/utils'
import type { IHydrographDatasource } from '@/interfaces/st2'

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
  sensorDeployments: SensorDeploymentRow[]
  sampleMethodsBySampleId: Record<number, string>
  /** Staff on the visit behind each of the latest samples (field sheet · Staff). */
  staffBySampleId: Record<number, string>
  /** Full-history chart series (compilation adapter). */
  chartSeries: IHydrographDatasource[]
  /** Full-history year span for the chart title (compilation adapter). */
  yearSpan: string
}
