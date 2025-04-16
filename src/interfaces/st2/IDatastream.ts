import { IBaseSTEntity, IThing, ISensor } from "@/interfaces/st2";

export interface IDatastream extends IBaseSTEntity {
  unitOfMeasurement: any;
  observationType: string;

  Thing?: IThing;
  Sensor?: ISensor;
}
