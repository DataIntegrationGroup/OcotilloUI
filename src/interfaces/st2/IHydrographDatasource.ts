import { IObservation } from "@/interfaces/st2";

export interface IHydrographDatasource {
  id: number;
  data: IObservation[];
  name: string;
  style?: string;
}
