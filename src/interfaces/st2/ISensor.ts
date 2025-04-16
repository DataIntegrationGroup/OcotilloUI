import { IBaseSTEntity } from "@/interfaces/st2";

export interface ISensor extends IBaseSTEntity {
  encodingType: string;
  metadata: string;
}
