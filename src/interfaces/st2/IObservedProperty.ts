import { IBaseSTEntity } from "@/interfaces/st2";

export interface IObservedProperty extends IBaseSTEntity {
  definition: string;
  name: string;
}
