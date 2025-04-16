import { IBaseSTEntity, ILocation } from "@/interfaces/st2";

export interface IThing extends IBaseSTEntity {
  Locations?: ILocation[];
}
