import { IDatastream } from "@/interfaces/st2";

export interface IObservation {
  // "@iot.id"?: string;
  phenomenonTime: string;
  result: number;
  Datastream?: IDatastream;
}
