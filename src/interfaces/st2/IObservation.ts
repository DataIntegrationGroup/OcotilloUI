import { IDatastream } from '@/interfaces/st2'

export interface IObservation {
  '@iot.id'?: string | number
  phenomenonTime: Date
  result: number
  Datastream?: IDatastream
}
