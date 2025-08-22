import { IDatastream } from '@/interfaces/st2'

export interface IObservation {
  // "@iot.id"?: string;
  phenomenonTime: Date
  result: number
  Datastream?: IDatastream
}
